function idNovo() {
  return 'C-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

function mapRow(r) {
  return {
    id: r.id,
    dataEnvio: r.data_envio,
    nome: r.nome,
    email: r.email || '',
    telefone: r.telefone || '',
    empresa: r.empresa || '',
    acompanhantes: r.acompanhantes ?? '',
    restricoes: r.restricoes || '',
    extra: r.extra || '',
  };
}

export async function listar(db) {
  const { results } = await db.prepare('SELECT * FROM rsvps ORDER BY data_envio ASC').all();
  return results.map(mapRow);
}

export async function adicionar(db, dados) {
  const registro = {
    id: idNovo(),
    dataEnvio: new Date().toISOString(),
    nome: dados.nome,
    email: dados.email || '',
    telefone: dados.telefone || '',
    empresa: dados.empresa || '',
    acompanhantes: dados.acompanhantes ?? '',
    restricoes: dados.restricoes || '',
    extra: dados.extra || '',
  };
  await db
    .prepare(
      'INSERT INTO rsvps (id, data_envio, nome, email, telefone, empresa, acompanhantes, restricoes, extra) VALUES (?,?,?,?,?,?,?,?,?)'
    )
    .bind(
      registro.id,
      registro.dataEnvio,
      registro.nome,
      registro.email,
      registro.telefone,
      registro.empresa,
      String(registro.acompanhantes),
      registro.restricoes,
      registro.extra
    )
    .run();
  return registro;
}

export async function remover(db, id) {
  await db.prepare('DELETE FROM rsvps WHERE id = ?').bind(id).run();
}

export async function paraCsv(db) {
  const lista = await listar(db);
  const colunas = ['id', 'dataEnvio', 'nome', 'email', 'telefone', 'empresa', 'acompanhantes', 'restricoes', 'extra'];
  const linhas = [colunas.join(',')];
  for (const r of lista) {
    linhas.push(
      colunas
        .map((c) => {
          const v = r[c] == null ? '' : String(r[c]).replace(/"/g, '""');
          return /[",\n]/.test(v) ? `"${v}"` : v;
        })
        .join(',')
    );
  }
  return linhas.join('\n');
}
