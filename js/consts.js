/* =========================================================
   Textos fixos do POP
   POPs, equipe, escala, rodízios e reuniões vêm do documento
   "HYPE Cultura e POP" v1.0 (outubro de 2026).
   Os registros da operação ficam no Supabase.
   ========================================================= */
const ROLE = {socio:'Sócio', gerente:'Gerente', barbeiro:'Barbeiro', atendente:'Atendente', dev:'Desenvolvedor'};
const AREAS = {
  cultura:'Inegociáveis', abertura:'Abertura', recepcao:'Recepção', agenda:'Agenda', atendimento:'Atendimento',
  barbeiros:'Barbeiros', vendas:'Preços e indicações', jornada:'Jornada do cliente', fechamento:'Fechamento', gestao:'Reuniões',
};

/* Cultura HYPE (complemento do POP) */
const CULTURA = {
  missao:'Oferecer a cada cliente uma experiência de cuidado, relaxamento e renovação, com atenção a cada detalhe, domínio técnico e soluções reais para o seu cabelo, barba e pele.',
  visao:'Ser a barbearia referência em qualidade e satisfação dos clientes na Zona Norte do Recife.',
  valores:[
    ['Cooperação', 'Jogamos juntos e cobrimos uns aos outros.', 'Sem cliente na cadeira? Olhe ao redor.'],
    ['Posicionamento', 'Somos autoridade no que fazemos.', 'Quem domina o assunto não precisa convencer: o cliente confia.'],
    ['Atenção', 'Fazemos o cliente se sentir cuidado.', 'Lembrar o nome de todos os clientes atendidos.'],
    ['Intenção', 'Todo atendimento resolve algo.', 'Não vendemos serviços. Resolvemos problemas.'],
  ],
};

/* Escala, rodízios e reuniões (POP, págs. 6 e 17) */
const ESCALA = {
  horario:'Segunda a sexta, 09h às 20h. Sábado, 09h às 18h, e todos os barbeiros chegam às 08:50.',
  posicoes:'Posição padrão: Magda no balcão do Lounge, Suellen no sofá da recepção.',
  turnos:[['breno','Abertura · 08:50','Quarta'], ['daniel','Abertura · 08:50','Quarta'], ['durval','Fechamento · 10:50','Terça'], ['heberth','Fechamento · 10:50','Terça'],
    ['robson','Sem horário fixo, em geral da abertura ao fechamento','Segunda'], ['magda','Abertura · almoço 12h às 13h','A definir'], ['suellen','Fechamento · almoço 14h às 15h','A definir']],
  rodizios:[['Retirada das grades, 08:50','Diário','Barbeiros presentes'], ['Fechamento das grades','Seg · Qua · Sex','Durval e Heberth'], ['Fechamento das grades','Ter · Qui · Sáb','Breno e Daniel'],
    ['Limpeza da bancada infantil','Diário','Barbeiros, em revezamento (escala por dia a definir)'], ['Aguar as plantas','Seg · Qui','Atendentes, em revezamento (escala por dia a definir)'], ['Limpeza dos gradis e produtos','Seg · Qua · Sex','Atendentes, alternando (escala por dia a definir)'],
    ['Reunião de técnicas','Seg · quinzenal','Robson']],
  reunioes:[['Segunda','14:00 às 15:00','Gestão','Semanal'], ['Segunda','19:00 às 19:30','Alinhamento semanal','Semanal'], ['Segunda','19:30 às 20:30','Técnicas com Robson','Quinzenal: 19/10, 02/11, 16/11, 30/11 e 14/12'],
    ['Terça','09:00 às 11:30','One-on-ones de 30 min: Breno 09:00, Magda 09:30, Daniel 10:00, Heberth 10:30, Suellen 11:00','Semanal. A definir: terça é a folga do Heberth'],
    ['Quarta','09:00 às 10:00','One-on-ones de 30 min: Durval 09:00, Jessica 09:30','Semanal']],
};

