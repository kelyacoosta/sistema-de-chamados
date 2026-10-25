import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AtualizarPessoaDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'O nome não pode ser vazio' })
    nome?: string;

    @IsOptional()
    @IsEmail({}, { message: 'E-mail inválido' })
    email?: string;

    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}