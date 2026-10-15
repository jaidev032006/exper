import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  type: z.enum(['EXPENSE', 'INCOME']),
  icon: z.string().default('tag'),
  color: z.string().default('#2563eb'),
});

// List categories for user
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type } = req.query;

    const where: any = {
      OR: [{ userId }, { userId: null, isDefault: true }],
    };

    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// Create custom category
router.post('/', requireAuth, validateBody(categorySchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, type, icon, color } = req.body;

    const category = await prisma.category.create({
      data: {
        userId,
        name: name.trim(),
        type,
        icon,
        color,
        isDefault: false,
      },
    });

    res.status(201).json({ success: true, message: 'Category created successfully', data: category });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
});

// Update custom category
router.put('/:id', requireAuth, validateBody(categorySchema.partial()), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Custom category not found or not editable' });
      return;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: req.body,
    });

    res.json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
});

// Delete custom category
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Custom category not found or system category cannot be deleted' });
      return;
    }

    // Set categoryId to null on associated transactions before deleting
    await prisma.transaction.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
});

export default router;
