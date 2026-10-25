import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StatusChamado } from '../generated/prisma/client.js';
import { CriarChamadoDto } from './dto/criar-chamado.dto.js';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';

const LIMITE_ATENDIMENTOS = 5;

const TRANSICOES: Record<StatusChamado, StatusChamado[]> = {
    ABERTO: ['EM_ATENDIMENTO', 'CANCELADO'],
    EM_ATENDIMENTO: ['RESOLVIDO', 'CANCELADO'],
    RESOLVIDO: ['EM_ATENDIMENTO', 'FECHADO'],
    FECHADO: [],
    CANCELADO: [],
};

@Injectable()
export class ChamadosService {
    constructor(private readonly prisma: PrismaService) { }

    async abrir(dto: CriarChamadoDto) {
        const solicitante = await this.prisma.pessoa.findUnique({
            where: { id: dto.solicitanteId },
        });
        if (!solicitante) throw new NotFoundException('Solicitante não encontrado');
        if (solicitante.tipo !== 'SOLICITANTE' || !solicitante.ativo)
            throw new UnprocessableEntityException(
                'Quem abre o chamado deve ser um solicitante ativo',
            );

        const tipo = await this.prisma.tipoProblema.findUnique({
            where: { id: dto.tipoProblemaId },
        });
        if (!tipo) throw new NotFoundException('Tipo de problema não encontrado');
        if (!tipo.ativo)
            throw new UnprocessableEntityException('Tipo de problema desativado');

        return this.prisma.chamado.create({ data: dto });
    }

    listar(filtros: FiltrarChamadosDto) {
        return this.prisma.chamado.findMany({
            where: filtros,
            orderBy: { id: 'asc' },
        });
    }

    async buscar(id: number) {
        const chamado = await this.prisma.chamado.findUnique({
            where: { id },
            include: {
                solicitante: true,
                tecnico: true,
                tipoProblema: true,
                comentarios: { include: { autor: true }, orderBy: { criadoEm: 'asc' } },
            },
        });
        if (!chamado) throw new NotFoundException(`Chamado ${id} não encontrado`);
        return chamado;
    }

    async designarTecnico(id: number, tecnicoId: number) {
        const chamado = await this.buscar(id);
        if (chamado.status === 'FECHADO' || chamado.status === 'CANCELADO')
            throw new UnprocessableEntityException(
                'Chamado encerrado não pode ser alterado',
            );
        if (chamado.status === 'RESOLVIDO')
            throw new UnprocessableEntityException(
                'Reabra o chamado antes de trocar o técnico',
            );

        const tecnico = await this.prisma.pessoa.findUnique({
            where: { id: tecnicoId },
        });
        if (!tecnico) throw new NotFoundException('Técnico não encontrado');
        if (tecnico.tipo !== 'TECNICO' || !tecnico.ativo)
            throw new UnprocessableEntityException(
                'Apenas um técnico ativo pode ser designado',
            );
        if (tecnico.id === chamado.solicitanteId)
            throw new UnprocessableEntityException(
                'Ninguém pode atender o próprio chamado',
            );

        if (chamado.tecnicoId !== tecnicoId) await this.validarLimite(tecnicoId);

        return this.prisma.chamado.update({
            where: { id },
            data: { tecnicoId, status: 'EM_ATENDIMENTO' },
        });
    }

    async mudarStatus(id: number, novo: StatusChamado) {
        const chamado = await this.buscar(id);

        if (!TRANSICOES[chamado.status].includes(novo))
            throw new UnprocessableEntityException(
                `Transição proibida: ${chamado.status} → ${novo}`,
            );

        const data: { status: StatusChamado; resolvidoEm?: Date | null } = {
            status: novo,
        };

        if (novo === 'EM_ATENDIMENTO') {
            if (!chamado.tecnicoId)
                throw new UnprocessableEntityException(
                    'Designe um técnico para iniciar o atendimento',
                );
            await this.validarLimite(chamado.tecnicoId);
            data.resolvidoEm = null;
        }
        if (novo === 'RESOLVIDO') data.resolvidoEm = new Date();

        return this.prisma.chamado.update({ where: { id }, data });
    }

    async comentar(chamadoId: number, dto: CriarComentarioDto) {
        const chamado = await this.buscar(chamadoId);
        if (chamado.status === 'FECHADO' || chamado.status === 'CANCELADO')
            throw new UnprocessableEntityException(
                'Chamado encerrado não recebe comentários',
            );

        const autor = await this.prisma.pessoa.findUnique({
            where: { id: dto.autorId },
        });
        if (!autor) throw new NotFoundException('Autor não encontrado');
        if (!autor.ativo)
            throw new UnprocessableEntityException(
                'Pessoa inativa não pode comentar',
            );

        const ehParticipante =
            autor.id === chamado.solicitanteId || autor.id === chamado.tecnicoId;
        if (!ehParticipante)
            throw new ForbiddenException(
                'Só o solicitante e o técnico responsável podem comentar',
            );

        return this.prisma.comentario.create({
            data: { texto: dto.texto, chamadoId, autorId: autor.id },
        });
    }

    private async validarLimite(tecnicoId: number) {
        const total = await this.prisma.chamado.count({
            where: { tecnicoId, status: 'EM_ATENDIMENTO' },
        });
        if (total >= LIMITE_ATENDIMENTOS)
            throw new UnprocessableEntityException(
                'Técnico já tem 5 chamados em atendimento',
            );
    }
}