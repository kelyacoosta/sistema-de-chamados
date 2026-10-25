import { IsEnum } from 'class-validator';
import { StatusChamado } from '../../generated/prisma/client.js';

export class MudarStatusDto {
    @IsEnum(StatusChamado, { message: 'Status inválido' })
    status: StatusChamado;
}