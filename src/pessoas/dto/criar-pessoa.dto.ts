import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoPessoa } from '../../generated/prisma/client.js';

export class CriarPessoaDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    nome: string;

    @IsEmail({}, { message: 'E-mail inválido' })
    email: string;

    @IsEnum(TipoPessoa, { message: 'Tipo deve ser SOLICITANTE ou TECNICO' })
    tipo: TipoPessoa;
}