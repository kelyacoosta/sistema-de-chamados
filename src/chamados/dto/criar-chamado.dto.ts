import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Length,
    MinLength,
} from 'class-validator';
import { Prioridade } from '../../generated/prisma/client.js';

export class CriarChamadoDto {
    @IsString()
    @Length(5, 100, { message: 'O título deve ter entre 5 e 100 caracteres' })
    titulo: string;

    @IsString()
    @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
    descricao: string;

    @IsOptional()
    @IsEnum(Prioridade, {
        message: 'Prioridade deve ser BAIXA, MEDIA, ALTA ou CRITICA',
    })
    prioridade?: Prioridade;

    @IsInt()
    solicitanteId: number;

    @IsInt()
    tipoProblemaId: number;
}