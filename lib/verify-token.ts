import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  rol: string;
  email: string;
}

export async function verifyToken(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Token no proporcionado o inválido', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return { error: 'Token no proporcionado', status: 401 };
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret-key';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    return { decoded };
  } catch (error: any) {
    console.error('Error verifying token:', error);
    if (error.name === 'TokenExpiredError') {
      return { error: 'El token ha expirado. Por favor, inicie sesión nuevamente.', status: 401 };
    }
    return { error: 'Token inválido', status: 401 };
  }
}
