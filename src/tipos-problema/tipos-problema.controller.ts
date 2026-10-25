import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { TiposProblemaService } from './tipos-problema.service.js';
import { CriarTipoProblemaDto } from './dto/criar-tipo-problema.dto.js';
import { AtualizarTipoProblemaDto } from './dto/atualizar-tipo-problema.dto.js';

@Controller('tipos-problema')
export class TiposProblemaController {
    constructor(private readonly tiposService: TiposProblemaService) { }

    @Post()
    criar(@Body() dto: CriarTipoProblemaDto) {
        return this.tiposService.criar(dto);
    }

    @Get()
    listar() {
        return this.tiposService.listar();
    }

    @Get(':id')
    buscar(@Param('id', ParseIntPipe) id: number) {
        return this.tiposService.buscar(id);
    }

    @Patch(':id')
    atualizar(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AtualizarTipoProblemaDto,
    ) {
        return this.tiposService.atualizar(id, dto);
    }

    @Delete(':id')
    remover(@Param('id', ParseIntPipe) id: number) {
        return this.tiposService.remover(id);
    }
}