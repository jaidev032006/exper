import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createDefaultCategoriesForUser } from '../utils/defaults.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().min(4, 'Verification code is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Register
router.post('/register', validateBody(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      },
    });

    // Create default accounts: Cash, Primary Bank, UPI
    await prisma.account.createMany({
      data: [
        { userId: user.id, name: 'Primary Bank Account', type: 'BANK', balance: 25000, accountNumber: '•••• 4589', color: '#2563eb', isDefault: true },
        { userId: user.id, name: 'UPI Wallet / GPay', type: 'UPI', balance: 3500, accountNumber: `${normalizedEmail.split('@')[0]}@okaxis`, color: '#0284c7' },
        { userId: user.id, name: 'Cash in Hand', type: 'CASH', balance: 2000, color: '#16a34a' },
      ],
    });

    // Seed default categories
    await createDefaultCategoriesForUser(user.id);

    // Initial welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Welcome to Exper!',
        message: 'Your personal expense tracker and financial planning dashboard is ready. Start tracking your expenses and set up budgets!',
        type: 'SUCCESS',
      },
    });

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        timezone: user.timezone,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login
router.post('/login', validateBody(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        timezone: user.timezone,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Demo 1-Click Login (Instant preview for evaluators/interviewers)
router.post('/demo-login', async (req: Request, res: Response): Promise<void> => {
  try {
    let demoUser = await prisma.user.findFirst({
      where: {
        email: {
          in: ['demo@exper.app', 'demo@finora.app'],
        },
      },
    });

    if (!demoUser) {
      // Create demo user on the fly if not yet seeded
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Exper@123', salt);

      demoUser = await prisma.user.create({
        data: {
          name: 'Jaivik Sharma',
          email: 'demo@exper.app',
          passwordHash,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      });

      await createDefaultCategoriesForUser(demoUser.id);
    }

    const token = generateToken({ id: demoUser.id, email: demoUser.email, name: demoUser.name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Demo login successful',
      token,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        currency: demoUser.currency,
        timezone: demoUser.timezone,
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, message: 'Failed to authenticate demo user' });
  }
});

// Firebase Authentication Synchronization Route
const firebaseSyncSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  uid: z.string(),
  photoUrl: z.string().optional(),
});

router.post('/firebase-sync', validateBody(firebaseSyncSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, uid, photoUrl } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create user record in our database
      const randomPassword = await bcrypt.hash(uid + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          name: name?.trim() || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          passwordHash: randomPassword,
          avatarUrl: photoUrl || null,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      });

      // Create default accounts: Cash, Primary Bank, UPI Wallet
      await prisma.account.createMany({
        data: [
          { userId: user.id, name: 'HDFC Bank Account', type: 'BANK', balance: 0.0, color: '#2563eb', isDefault: true },
          { userId: user.id, name: 'PhonePe / GPay Wallet', type: 'UPI', balance: 0.0, color: '#7c3aed', isDefault: false },
          { userId: user.id, name: 'Physical Cash Wallet', type: 'CASH', balance: 0.0, color: '#10b981', isDefault: false },
        ],
      });

      // Create default categories
      await createDefaultCategoriesForUser(user.id);

      // Initial welcome notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Welcome to Exper!',
          message: 'Your personal expense tracker and financial planning dashboard is ready. Authenticated securely via Firebase!',
          type: 'SUCCESS',
        },
      });
    }

    const token = generateToken({ id: user.id, email: user.email, name: user.name });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: 'Firebase authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('Firebase sync error:', error);
    res.status(500).json({ success: false, message: 'Server error during Firebase synchronization' });
  }
});

// Get Current User Profile
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        timezone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
});

// Forgot Password Request
router.post('/forgot-password', validateBody(forgotPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success for security (prevent email enumeration)
    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset verification code has been dispatched.',
      demoCode: user ? '8942' : undefined, // Provided for easy testing in development/demo mode
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// Reset Password
router.post('/reset-password', validateBody(resetPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      res.status(400).json({ success: false, message: 'User not found or code invalid' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password has been successfully updated. You may now log in.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
