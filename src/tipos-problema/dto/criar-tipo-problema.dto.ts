import { IsNotEmpty, IsString } from 'class-validator';

export class CriarTipoProblemaDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome é obrigatório' })
    nome: string;
}