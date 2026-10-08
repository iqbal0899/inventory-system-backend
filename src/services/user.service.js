import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

export async function getUsersService({
  page = 1,
  limit = 10,
  search = "",
  role,
} = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (currentPage - 1) * perPage;

  const where = {};

  if (search?.trim()) {
    where.OR = [
      {
        username: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
      {
        email: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
    ];
  }

  if (role && ["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip,
      take: perPage,
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);

  return {
    data: users,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    },
  };
}

export async function getUserByIdService(userId) {
  const id = Number(userId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ID user tidak valid");
  }

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: userSelect,
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  return user;
}

export async function createUserService({
  username,
  email,
  password,
  role = "STAFF",
}) {
  if (!username?.trim()) {
    throw new Error("Username wajib diisi");
  }

  if (!email?.trim()) {
    throw new Error("Email wajib diisi");
  }

  if (!password) {
    throw new Error("Password wajib diisi");
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter");
  }

  if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
    throw new Error("Role tidak valid");
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          username: normalizedUsername,
        },
        {
          email: normalizedEmail,
        },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.username === normalizedUsername) {
      throw new Error("Username sudah digunakan");
    }

    if (existingUser.email === normalizedEmail) {
      throw new Error("Email sudah digunakan");
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    },
    select: userSelect,
  });
}

export async function updateUserService(
  userId,
  {
    username,
    email,
    password,
    role,
  }
) {
  const id = Number(userId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ID user tidak valid");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw new Error("User tidak ditemukan");
  }

  const data = {};

  if (username !== undefined) {
    if (!username.trim()) {
      throw new Error("Username wajib diisi");
    }

    data.username = username.trim();
  }

  if (email !== undefined) {
    if (!email.trim()) {
      throw new Error("Email wajib diisi");
    }

    data.email = email.trim().toLowerCase();
  }

  if (role !== undefined) {
    if (!["SUPER_ADMIN", "ADMIN", "STAFF"].includes(role)) {
      throw new Error("Role tidak valid");
    }

    data.role = role;
  }

  if (password !== undefined && password !== "") {
    if (password.length < 6) {
      throw new Error("Password minimal 6 karakter");
    }

    data.password = await bcrypt.hash(password, 10);
  }

  if (data.username || data.email) {
    const duplicateUser = await prisma.user.findFirst({
      where: {
        OR: [
          data.username
            ? {
                username: data.username,
              }
            : undefined,
          data.email
            ? {
                email: data.email,
              }
            : undefined,
        ].filter(Boolean),
        NOT: {
          id,
        },
      },
    });

    if (duplicateUser) {
      if (
        data.username &&
        duplicateUser.username === data.username
      ) {
        throw new Error("Username sudah digunakan");
      }

      if (
        data.email &&
        duplicateUser.email === data.email
      ) {
        throw new Error("Email sudah digunakan");
      }
    }
  }

  return prisma.user.update({
    where: {
      id,
    },
    data,
    select: userSelect,
  });
}

export async function deleteUserService(userId, currentUserId) {
  const id = Number(userId);
  const currentId = Number(currentUserId);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ID user tidak valid");
  }

  if (id === currentId) {
    throw new Error("Tidak dapat menghapus akun sendiri");
  }

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  if (user.role === "SUPER_ADMIN") {
    const totalSuperAdmin = await prisma.user.count({
      where: {
        role: "SUPER_ADMIN",
      },
    });

    if (totalSuperAdmin <= 1) {
      throw new Error(
        "Tidak dapat menghapus SUPER_ADMIN terakhir"
      );
    }
  }

  return prisma.user.delete({
    where: {
      id,
    },
    select: userSelect,
  });
}