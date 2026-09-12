import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.ts';

// In-memory token store mapping token -> userId
const sessions = new Map<string, string>();
// Pre-register demo token for convenience
const DEMO_TOKEN = 'demo-token-master-adventurer';
sessions.set(DEMO_TOKEN, 'demo-user-1');

function generateToken(userId: string): string {
  const token = `lrpg_${crypto.randomUUID()}_${Date.now()}`;
  sessions.set(token, userId);
  return token;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token, check query parameter for convenience
    const queryToken = req.query.token as string;
    if (queryToken && sessions.has(queryToken)) {
      req.userId = sessions.get(queryToken);
      return next();
    }
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = sessions.get(token);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    return;
  }

  req.userId = userId;
  next();
}

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.use(express.json());

  // CORS headers for serverless / custom domain deployments
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  const apiRouter = express.Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ status: 'ok', serverless: Boolean(process.env.VERCEL), timestamp: new Date().toISOString() });
  });

  // --- Auth Endpoints ---
  apiRouter.post('/auth/signup', (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
      }
      if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters long' });
      }

      const { user, character } = db.createUser(username, email, password);
      const token = generateToken(user.id);
      res.status(201).json({ token, user, character });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  apiRouter.post('/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required' });
      }

      const result = db.verifyCredentials(identifier, password);
      if (!result) {
        return res.status(401).json({ error: 'Invalid username/email or password' });
      }

      const token = generateToken(result.user.id);
      res.json({ token, user: result.user, character: result.character });
    } catch (err: any) {
      res.status(500).json({ error: 'Login error' });
    }
  });

  apiRouter.post('/auth/demo', (req, res) => {
    try {
      let demoUser = db.getUserById('demo-user-1');
      let demoChar = db.getCharacter('demo-user-1');
      if (!demoUser || !demoChar) {
        // Fallback auto-creation if demo user is missing
        const created = db.createUser('ShadowKnight', 'adventurer@liferpg.realm', 'adventurer123');
        demoUser = db.getUserById(created.user.id);
        demoChar = created.character;
      }
      const token = DEMO_TOKEN;
      const { passwordHash: _, ...safeUser } = demoUser!;
      res.json({ token, user: safeUser, character: demoChar });
    } catch (err: any) {
      console.error('Demo auth error:', err);
      res.status(500).json({ error: 'Failed to initialize demo session' });
    }
  });

  apiRouter.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
    const user = db.getUserById(req.userId!);
    const character = db.getCharacter(req.userId!);
    if (!user || !character) {
      return res.status(404).json({ error: 'User or character not found' });
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, character });
  });

  // --- Character & Profile Endpoints ---
  apiRouter.get('/character', authMiddleware, (req: AuthenticatedRequest, res) => {
    const character = db.getCharacter(req.userId!);
    if (!character) return res.status(404).json({ error: 'Character not found' });
    res.json(character);
  });

  apiRouter.post('/character/allocate-stat', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { attribute } = req.body;
      if (!attribute) return res.status(400).json({ error: 'Attribute required' });
      const character = db.allocateStat(req.userId!, attribute);
      res.json({ character });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to allocate stat point' });
    }
  });

  apiRouter.post('/character/class', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { characterClass } = req.body;
      if (!characterClass) return res.status(400).json({ error: 'Character class required' });
      const character = db.setCharacterClass(req.userId!, characterClass);
      res.json({ character });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to set character class' });
    }
  });

  // --- Quests Endpoints (CRUD + Complete) ---
  apiRouter.get('/quests', authMiddleware, (req: AuthenticatedRequest, res) => {
    const quests = db.getQuests(req.userId!);
    res.json(quests);
  });

  apiRouter.post('/quests', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { title, notes, difficulty, attribute, type, dueDate, modifier } = req.body;
      const quest = db.createQuest(req.userId!, {
        title,
        notes,
        difficulty: difficulty || 'medium',
        attribute: attribute || 'str',
        type: type || 'daily',
        dueDate,
        modifier
      });
      res.status(201).json(quest);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create quest' });
    }
  });

  apiRouter.put('/quests/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const quest = db.updateQuest(req.userId!, req.params.id, req.body);
      res.json(quest);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update quest' });
    }
  });

  apiRouter.delete('/quests/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const success = db.deleteQuest(req.userId!, req.params.id);
    if (!success) return res.status(404).json({ error: 'Quest not found' });
    res.json({ success: true });
  });

  // Complete Quest (Server-authoritative progression engine)
  apiRouter.post('/quests/:id/complete', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const result = db.completeQuest(req.userId!, req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to complete quest' });
    }
  });

  apiRouter.post('/quests/:id/uncomplete', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const result = db.uncompleteQuest(req.userId!, req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to uncomplete quest' });
    }
  });

  // --- Shop & Inventory Endpoints ---
  apiRouter.get('/shop/items', (req, res) => {
    res.json(db.getShopItems());
  });

  apiRouter.post('/shop/buy', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { itemId } = req.body;
      if (!itemId) return res.status(400).json({ error: 'Item ID required' });
      const result = db.buyItem(req.userId!, itemId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Purchase failed' });
    }
  });

  apiRouter.post('/shop/equip', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { itemId } = req.body;
      if (!itemId) return res.status(400).json({ error: 'Item ID required' });
      const character = db.equipItem(req.userId!, itemId);
      res.json({ character });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Equip failed' });
    }
  });

  apiRouter.post('/shop/unequip', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { slot } = req.body;
      if (!slot) return res.status(400).json({ error: 'Slot required' });
      const character = db.unequipItem(req.userId!, slot);
      res.json({ character });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Unequip failed' });
    }
  });

  // --- Custom Rewards Endpoints ---
  apiRouter.get('/custom-rewards', authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json(db.getCustomRewards(req.userId!));
  });

  apiRouter.post('/custom-rewards', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const { title, cost, icon } = req.body;
      const reward = db.createCustomReward(req.userId!, title, Number(cost), icon);
      res.status(201).json(reward);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create reward' });
    }
  });

  apiRouter.post('/custom-rewards/:id/redeem', authMiddleware, (req: AuthenticatedRequest, res) => {
    try {
      const result = db.redeemCustomReward(req.userId!, req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to redeem reward' });
    }
  });

  apiRouter.delete('/custom-rewards/:id', authMiddleware, (req: AuthenticatedRequest, res) => {
    const success = db.deleteCustomReward(req.userId!, req.params.id);
    if (!success) return res.status(404).json({ error: 'Reward not found' });
    res.json({ success: true });
  });

  // --- Activity Logs ---
  apiRouter.get('/logs', authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json(db.getActivityLogs(req.userId!));
  });

  // Mount API router under both `/api` and `/` so any rewrite on Vercel or locally works identically
  app.use('/api', apiRouter);
  app.use(apiRouter);

  // Global error handler so no uncaught error causes an empty 500 crash
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error handler caught:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
}

export const app = createApp();
export default app;
