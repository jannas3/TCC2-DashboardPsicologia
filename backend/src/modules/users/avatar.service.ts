import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const avatarService = {
  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        avatarUrl: true,
      },
    });
  },
};


