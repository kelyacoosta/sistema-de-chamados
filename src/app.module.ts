import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { PessoasModule } from './pessoas/pessoas.module.js';
import { TiposProblemaModule } from './tipos-problema/tipos-problema.module.js';
import { ChamadosModule } from './chamados/chamados.module.js';

@Module({
  imports: [PrismaModule, PessoasModule, TiposProblemaModule, ChamadosModule],
})
export class AppModule { }