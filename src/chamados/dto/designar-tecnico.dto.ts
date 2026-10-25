import { IsInt } from 'class-validator';

export class DesignarTecnicoDto {
    @IsInt()
    tecnicoId: number;
}