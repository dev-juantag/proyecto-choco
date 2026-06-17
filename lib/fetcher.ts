export const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('gestion-poblacional-token') : null;
  const res = await fetch(url, {
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('gestion-poblacional-token');
    window.location.href = '/?expired=true';
    throw new Error('Sesión expirada o token inválido');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Ocurrió un error al cargar los datos.');
  }
  return res.json();
};
export default fetcher;
