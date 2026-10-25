import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AtualizarTipoProblemaDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'O nome não pode ser vazio' })
    nome?: string;

    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}