import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ChamadosService } from './chamados.service.js';
import { CriarChamadoDto } from './dto/criar-chamado.dto.js';
import { FiltrarChamadosDto } from './dto/filtrar-chamados.dto.js';
import { DesignarTecnicoDto } from './dto/designar-tecnico.dto.js';
import { MudarStatusDto } from './dto/mudar-status.dto.js';
import { CriarComentarioDto } from './dto/criar-comentario.dto.js';

@Controller('chamados')
export class ChamadosController {
    constructor(private readonly chamadosService: ChamadosService) { }

    @Post()
    abrir(@Body() dto: CriarChamadoDto) {
        return this.chamadosService.abrir(dto);
    }

    @Get()
    listar(@Query() filtros: FiltrarChamadosDto) {
        return this.chamadosService.listar(filtros);
    }

    @Get(':id')
    buscar(@Param('id', ParseIntPipe) id: number) {
        return this.chamadosService.buscar(id);
    }

    @Patch(':id/tecnico')
    designar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: DesignarTecnicoDto,
    ) {
        return this.chamadosService.designarTecnico(id, dto.tecnicoId);
    }

    @Patch(':id/status')
    mudarStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MudarStatusDto,
    ) {
        return this.chamadosService.mudarStatus(id, dto.status);
    }

    @Post(':id/comentarios')
    comentar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CriarComentarioDto,
    ) {
        return this.chamadosService.comentar(id, dto);
    }
}