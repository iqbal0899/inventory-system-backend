import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import { generateToken } from "../utils/jwt.js";

export async function loginUser(username, password) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    throw new Error("Username atau password salah");
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw new Error("Username atau password salah");
  }

  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
}