import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Prioridade, StatusChamado } from '../../generated/prisma/client.js';

export class FiltrarChamadosDto {
    @IsOptional()
    @IsEnum(StatusChamado)
    status?: StatusChamado;

    @IsOptional()
    @IsEnum(Prioridade)
    prioridade?: Prioridade;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    tipoProblemaId?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    tecnicoId?: number;
}