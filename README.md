# Sistema de Chamados

API REST para registrar e acompanhar chamados de suporte. Solicitantes abrem chamados, técnicos os atendem até a resolução, e toda a conversa fica registrada no histórico do chamado.

Trabalho do curso Técnico em Desenvolvimento de Sistemas (SENAI).

**Autor(a):** Kely André

## Tecnologias

- **NestJS** (TypeScript, módulos ESM)
- **Prisma 7** (ORM) com o adaptador `@prisma/adapter-mariadb`
- **MySQL 8**
- **class-validator** e **class-transformer** (validação dos dados de entrada)

## Pré-requisitos

- Node.js 22 ou superior
- npm 10 ou superior
- MySQL 8 rodando em `localhost:3306` (instalado no Windows ou via Docker)

## Como rodar

**1. Instalar as dependências**

```bash
npm install
```

**2. Criar o banco de dados**

No MySQL, crie um banco vazio chamado `chamados`:

```sql
CREATE DATABASE chamados;
```

Se preferir Docker, suba o MySQL com um `docker-compose.yml` usando a imagem `mysql:8.4`, `MYSQL_ROOT_PASSWORD=root` e `MYSQL_DATABASE=chamados`.

**3. Configurar a conexão**

Crie um arquivo `.env` na raiz do projeto:

```
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/chamados"
```

**4. Criar as tabelas e gerar o client do Prisma**

```bash
npx prisma migrate dev
npx prisma generate
```

**5. Iniciar a API**

```bash
npm run start:dev
```

A API fica disponível em `http://localhost:3000`.

Para ver os dados no banco de forma visual: `npx prisma studio`.

## Estrutura do projeto

```
prisma/
├── schema.prisma            modelo do banco (tabelas, enums, relações)
└── migrations/              histórico de alterações do banco
src/
├── prisma/                  PrismaService e PrismaModule (conexão com o banco)
├── generated/prisma/        client gerado pelo Prisma (não editar)
├── pessoas/                 módulo de pessoas (controller, service, dto)
├── tipos-problema/          módulo de tipos de problema
├── chamados/                módulo de chamados e comentários
├── app.module.ts
└── main.ts
```

Cada módulo segue o mesmo padrão: o **controller** recebe as requisições HTTP, o **service** contém as regras de negócio e fala com o banco, e os **DTOs** descrevem e validam os dados que chegam.

## Modelo de dados

| Tabela | Campos principais |
|---|---|
| **Pessoa** | id, nome, email (único), tipo (`SOLICITANTE` ou `TECNICO`), ativo |
| **TipoProblema** | id, nome (único), ativo |
| **Chamado** | id, titulo, descricao, prioridade, status, criadoEm, resolvidoEm, solicitanteId, tecnicoId (opcional), tipoProblemaId |
| **Comentario** | id, texto, criadoEm, chamadoId, autorId |

Enums: `TipoPessoa`, `Prioridade` (`BAIXA`, `MEDIA`, `ALTA`, `CRITICA`) e `StatusChamado` (`ABERTO`, `EM_ATENDIMENTO`, `RESOLVIDO`, `FECHADO`, `CANCELADO`).

## Rotas

### Pessoas

| Método | Rota | Ação |
|---|---|---|
| POST | `/pessoas` | Cadastra uma pessoa |
| GET | `/pessoas` | Lista todas |
| GET | `/pessoas/:id` | Busca uma |
| PATCH | `/pessoas/:id` | Atualiza nome, e-mail ou situação (ativo) |
| DELETE | `/pessoas/:id` | Remove (somente se nunca esteve em um chamado) |

### Tipos de problema

| Método | Rota | Ação |
|---|---|---|
| POST | `/tipos-problema` | Cadastra um tipo |
| GET | `/tipos-problema` | Lista todos |
| GET | `/tipos-problema/:id` | Busca um |
| PATCH | `/tipos-problema/:id` | Atualiza nome ou situação (ativo) |
| DELETE | `/tipos-problema/:id` | Remove (somente se nunca foi usado) |

### Chamados

| Método | Rota | Ação |
|---|---|---|
| POST | `/chamados` | Abre um chamado |
| GET | `/chamados` | Lista, com filtros opcionais |
| GET | `/chamados/:id` | Mostra o chamado com solicitante, técnico, tipo e toda a conversa |
| PATCH | `/chamados/:id/tecnico` | Designa o técnico (e inicia o atendimento) |
| PATCH | `/chamados/:id/status` | Muda a situação do chamado |
| POST | `/chamados/:id/comentarios` | Registra um comentário |

**Filtros da listagem** (todos opcionais e combináveis):
`GET /chamados?status=EM_ATENDIMENTO&prioridade=ALTA&tipoProblemaId=1&tecnicoId=3`

### Exemplos de corpo das requisições

Cadastrar pessoa:
```json
{ "nome": "Maria", "email": "maria@email.com", "tipo": "SOLICITANTE" }
```

Abrir chamado (a prioridade é opcional e assume `MEDIA`):
```json
{
  "titulo": "Internet caiu",
  "descricao": "A internet do setor financeiro parou de funcionar",
  "prioridade": "ALTA",
  "solicitanteId": 1,
  "tipoProblemaId": 1
}
```

Designar técnico: `{ "tecnicoId": 3 }`
Mudar status: `{ "status": "RESOLVIDO" }`
Comentar: `{ "autorId": 1, "texto": "Ainda sem internet aqui" }`

### Códigos de resposta de erro

| Código | Quando acontece |
|---|---|
| 400 | Dados inválidos (e-mail, título, descrição, enum, comentário vazio, filtro inválido) |
| 403 | Quem tenta comentar não é o solicitante nem o técnico responsável |
| 404 | Pessoa, tipo ou chamado não encontrado |
| 409 | E-mail ou nome duplicado; remoção de quem já foi usado em chamados |
| 422 | Violação de regra de negócio (transição proibida, limite de 5, pessoa inativa, chamado encerrado etc.) |

## Onde cada regra de negócio foi implementada

| Regra | Descrição resumida | Onde |
|---|---|---|
| 1 | E-mail único e com formato válido | `@unique` no schema, `@IsEmail` no DTO e tratamento do erro `P2002` no `PessoasService` |
| 2 | Pessoa é solicitante ou técnico | Enum `TipoPessoa` + `@IsEnum` no DTO |
| 3 | Inativos não abrem, não são designados e não comentam | `ChamadosService`: `abrir`, `designarTecnico` e `comentar` |
| 4 | Quem participou de chamado não é removido, só desativado | `PessoasService.remover` (409) |
| 5 | Nome do tipo de problema único | `@unique` no schema + tratamento do `P2002` |
| 6 | Não abre chamado em tipo desativado | `ChamadosService.abrir` |
| 7 | Tipo já usado não é removido, só desativado | `TiposProblemaService.remover` (409) |
| 8 | Chamado nasce aberto e sem técnico | Defaults do schema (`ABERTO`, `tecnicoId` opcional) |
| 9 | Quem abre é solicitante ativo | `ChamadosService.abrir` |
| 10 | Título de 5 a 100 caracteres; descrição com no mínimo 10 | `@Length` e `@MinLength` no `CriarChamadoDto` |
| 11 | Prioridade com padrão `MEDIA` | Default do schema + `@IsEnum` opcional |
| 12 | Só técnico ativo é designado | `ChamadosService.designarTecnico` |
| 13 | Designar técnico em chamado aberto inicia o atendimento | `designarTecnico` grava `EM_ATENDIMENTO` |
| 14 | Fluxo de situações permitido | Tabela `TRANSICOES` em `ChamadosService.mudarStatus` |
| 15 | Fechado ou cancelado não muda nem recebe comentário | `TRANSICOES` vazia para esses status + checagens em `designarTecnico` e `comentar` |
| 16 | Registro do momento da resolução | Campo `resolvidoEm`, preenchido ao ir para `RESOLVIDO` |
| 17 | Máximo de 5 chamados em atendimento por técnico | `ChamadosService.validarLimite` |
| 18 | Ninguém atende o próprio chamado | Checagem em `designarTecnico` |
| 19 | Só solicitante e técnico responsável comentam | `ChamadosService.comentar` (403) |
| 20 | Comentário não pode ser vazio | `@IsNotEmpty` + `@Transform` que remove espaços das pontas |
| 21 | Comentários não podem ser alterados nem apagados | Não existem rotas PATCH nem DELETE de comentário |

## Decisões de interpretação

O documento de regras deixa alguns pontos em aberto. As decisões abaixo foram tomadas:

1. **Não se troca o técnico de um chamado `RESOLVIDO`.** É preciso reabri-lo antes (`RESOLVIDO` para `EM_ATENDIMENTO`).
2. **Ao reabrir um chamado resolvido, o limite de 5 também vale** e o campo `resolvidoEm` volta a `null`. Só é possível reabrir se o chamado já tiver técnico.
3. **O tipo da pessoa não muda depois de cadastrada.** O DTO de atualização não aceita o campo `tipo`.
4. **Não há autenticação.** Como o sistema não tem login, o `solicitanteId` e o `autorId` são enviados no corpo da requisição.
5. **O limite de 5 conta apenas chamados `EM_ATENDIMENTO`.** Chamados resolvidos, fechados ou cancelados liberam a vaga do técnico. Cancelar não passa pela checagem do limite.
6. **Pode-se trocar o técnico de um chamado `EM_ATENDIMENTO`,** desde que o novo técnico atenda às regras (ativo, do tipo técnico e com vaga).
7. **Desativar uma pessoa ou tipo não altera chamados já existentes.** A desativação vale para novas ações (abrir, designar, comentar).
8. **Remover só é permitido para quem nunca participou de um chamado.** No caso de pessoas, conta como participação ter sido solicitante ou técnico; comentar só é possível a quem já é um dos dois.

## Limitações conhecidas

- A checagem do limite de 5 atendimentos não usa transação. Em um cenário real com várias requisições simultâneas para o mesmo técnico, seria possível ultrapassar o limite. Para este trabalho, o fluxo sequencial é suficiente.
- Ao reabrir um chamado, o sistema verifica o limite do técnico, mas não confere se ele continua ativo.
- A regra 18 (ninguém atende o próprio chamado) também é garantida indiretamente pelas regras de tipo, já que o solicitante é sempre do tipo `SOLICITANTE` e o técnico do tipo `TECNICO`. A checagem explícita foi mantida por segurança.

## Como testar

O arquivo `testes.http` reúne todos os testes das regras, com o resultado esperado em cada título. Para usá-lo:

1. Instale a extensão **REST Client** no VS Code.
2. Deixe a API rodando (`npm run start:dev`).
3. Abra o `testes.http` e clique em **Send Request** em cada bloco, de cima para baixo.

Os blocos com `# @name` guardam a resposta para os blocos seguintes usarem, por isso a ordem importa.

Para repetir os testes do zero, limpe o banco com:

```bash
npx prisma migrate reset
```#   s i s t e m a - d e - c h a m a d o s  
 