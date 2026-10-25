import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CriarPessoaDto } from './dto/criar-pessoa.dto.js';
import { AtualizarPessoaDto } from './dto/atualizar-pessoa.dto.js';

@Injectable()
export class PessoasService {
    constructor(private readonly prisma: PrismaService) { }

    async criar(dto: CriarPessoaDto) {
        try {
            return await this.prisma.pessoa.create({ data: dto });
        } catch (e) {
            this.tratarEmailDuplicado(e);
            throw e;
        }
    }

    listar() {
        return this.prisma.pessoa.findMany({ orderBy: { id: 'asc' } });
    }

    async buscar(id: number) {
        const pessoa = await this.prisma.pessoa.findUnique({ where: { id } });
        if (!pessoa) throw new NotFoundException(`Pessoa ${id} não encontrada`);
        return pessoa;
    }

    async atualizar(id: number, dto: AtualizarPessoaDto) {
        await this.buscar(id);
        try {
            return await this.prisma.pessoa.update({ where: { id }, data: dto });
        } catch (e) {
            this.tratarEmailDuplicado(e);
            throw e;
        }
    }

    async remover(id: number) {
        await this.buscar(id);
        const envolvimentos = await this.prisma.chamado.count({
            where: { OR: [{ solicitanteId: id }, { tecnicoId: id }] },
        });
        if (envolvimentos > 0)
            throw new ConflictException(
                'Pessoa já envolvida em chamados: desative em vez de remover',
            );
        return this.prisma.pessoa.delete({ where: { id } });
    }

    private tratarEmailDuplicado(e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
            throw new ConflictException('E-mail já cadastrado');
    }
}