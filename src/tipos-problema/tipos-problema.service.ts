import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto.js';
import { AtualizarTipoProblemaDto } from './dto/atualizar-tipo-problema.dto.js';

@Injectable()
export class TiposProblemaService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarTipoProblemaDto) {
        try {
            return await this.prisma.tipoProblema.create({ data: dto });
        } catch (e) {
            this.tratarNomeDuplicado(e);
            throw e;
        }
    }

    listar() {
        return this.prisma.tipoProblema.findMany({ orderBy: { id: 'asc' } });
    }

    async buscar(id: number) {
        const tipo = await this.prisma.tipoProblema.findUnique({ where: { id } });
        if (!tipo)
            throw new NotFoundException(`Tipo de problema ${id} não encontrado`);
        return tipo;
    }

    async atualizar(id: number, dto: AtualizarTipoProblemaDto) {
        await this.buscar(id);
        try {
            return await this.prisma.tipoProblema.update({
                where: { id },
                data: dto,
            });
        } catch (e) {
            this.tratarNomeDuplicado(e);
            throw e;
        }
    }

    async remover(id: number) {
        await this.buscar(id);
        const usos = await this.prisma.chamado.count({
            where: { tipoProblemaId: id },
        });
        if (usos > 0)
            throw new ConflictException(
                'Tipo já usado em chamados: desative em vez de remover',
            );
        return this.prisma.tipoProblema.delete({ where: { id } });
    }

    private tratarNomeDuplicado(e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
            throw new ConflictException('Já existe um tipo de problema com esse nome');
    }
}