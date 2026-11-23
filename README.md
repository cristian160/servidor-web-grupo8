# Ateliê Flora — Agendamento de salão de beleza

Projeto do Grupo 8 para o **Entregável #5 — Aplicação Web rodando na Nuvem**, da Unifor. A aplicação permite consultar a agenda de um salão fictício em Fortaleza e reservar um horário. O servidor Node.js gera as páginas HTML, verifica a disponibilidade e registra cada agendamento.

**URL pública da aplicação:** a preencher após a publicação.

## Serviços e horários

| Serviço | Duração | Valor fictício |
| --- | --- | --- |
| Corte e finalização | 1 hora | R$ 85,00 |
| Hidratação capilar | 1 hora | R$ 70,00 |
| Escova modelada | 1 hora | R$ 65,00 |

O salão atende de segunda a sábado, no horário de Fortaleza. Como há uma única cadeira, cada reserva ocupa aquele horário para todos os serviços.

## Executar no computador

Com o Node.js instalado, extraia o ZIP e abra a pasta que contém `app.js` no VS Code. No terminal dessa pasta, execute:

```bash
node app.js
```

Abra [a aplicação local](http://localhost:3000) no navegador. O projeto usa apenas módulos nativos do Node.js e dispensa a instalação de dependências. Para encerrar o servidor, pressione `Ctrl+C` no terminal.

## Testar um agendamento

1. Escolha **Corte e finalização**, selecione uma data futura de segunda a sábado e clique em **Ver horários disponíveis**.
2. Escolha um horário e clique em **Confirmar agendamento**. A página exibirá o serviço, o valor, a data, o horário e o protocolo.
3. Volte ao início e consulte **Escova modelada** para a mesma data. O horário reservado deve ter saído da lista, inclusive para esse outro serviço.

## Funcionamento

| Rota | O que faz |
| --- | --- |
| `GET /` | Exibe o catálogo e o formulário de consulta. |
| `GET /horarios` | Recebe o serviço e a data e lista os horários futuros disponíveis. |
| `POST /reservar` | Valida a escolha, grava a reserva e devolve o protocolo. Se outra pessoa já reservou o horário, informa o conflito. |

O arquivo `app.js` contém o servidor e as regras da agenda. O arquivo `estilo.css` define a apresentação das páginas. Cada confirmação gera um arquivo JSON na pasta `reservas/`, criada pelo servidor. A variável `DATA_DIR` permite escolher outro diretório de gravação.

## Publicar no Render

Crie um Web Service no plano Free com este repositório, branch `main`, ambiente Node, build `npm install` e inicialização `node app.js`. Deixe o diretório raiz em branco. Após a publicação, teste a URL pública em uma janela anônima.

O disco do plano gratuito é temporário. As reservas podem ser perdidas em reinícios ou novas implantações.
