
import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import { generateToken } from "../utils/jwt.js";

export async function loginUser(username, password) {
  const user = await prisma.user.findUnique({
    where: {
      username: username.trim(),
    },
  });

  if (!user) {
    const error = new Error("Username tidak ditemukan.");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordValid) {
    const error = new Error(
      "Password yang Anda masukkan salah."
    );
    error.code = "INVALID_PASSWORD";
    throw error;
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
