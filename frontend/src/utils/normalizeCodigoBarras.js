const normalizeCodigoBarras = (value) => {
  // backend espera null quando não existe
  if (value === undefined || value === null) return null;

  const str = String(value).trim();
  if (!str) return null;

  return str;
};

export default normalizeCodigoBarras;

