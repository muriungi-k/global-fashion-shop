import { env } from 'cloudflare:workers';
import { catalog, Product, localizeImage, photoAssets, getProductSizes } from '../../../lib/catalog';
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const uid = () => crypto.randomUUID();
const hex = (a: ArrayBuffer) => Array.from(new Uint8Array(a)).map(n => n.toString(16).padStart(2, '0')).join('');
async function hash(password: string, salt: string) { const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)); }
async function session(req: Request) { const token = req.headers.get('cookie')?.match(/(?:^|;\s*)gf_session=([^;]+)/)?.[1]; if (!token)
    return null; return env.DB!.prepare('SELECT * FROM sessions WHERE id = ? AND expires > ?').bind(token, Date.now()).first<{
    user_id: string;
    role: string;
}>(); }
const cookie = (id: string, req: Request) => `gf_session=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${new URL(req.url).protocol === 'https:' ? '; Secure' : ''}`;
async function allProducts() { const r = await env.DB!.prepare('SELECT data FROM products').all<{
    data: string;
}>(); const map = new Map(catalog.map(p => [p.id, p])); for (const p of r.results) {
    const v = JSON.parse(p.data);
    v.image = localizeImage(v.image);
    map.set(v.id, v);
} return [...map.values()]; }
function orderForDisplay(o: any) { const data = JSON.parse(o.data); return { ...data, items: data.items.map((item: any) => ({ ...item, image: localizeImage(item.image) })), id: o.id, status: o.status, created: o.created }; }
export async function GET(req: Request) { try {
    const action = new URL(req.url).searchParams.get('action');
    if (action === 'products')
        return json({ products: await allProducts() });
    const s = await session(req);
    if (action === 'me') {
        if (!s)
            return json({ user: null });
        if (s.role === 'admin')
            return json({ user: { name: 'Store administrator', role: 'admin' } });
        const u = await env.DB!.prepare('SELECT id,name,email,address FROM users WHERE id=?').bind(s.user_id).first();
        return json({ user: u });
    }
    if (!s)
        return json({ error: 'Please sign in.' }, 401);
    if (action === 'orders') {
        const r = s.role === 'admin' ? await env.DB!.prepare('SELECT * FROM orders ORDER BY created DESC').all() : await env.DB!.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC').bind(s.user_id).all();
        return json({ orders: r.results.map(orderForDisplay) });
    }
    if (action === 'admin') {
        if (s.role !== 'admin')
            return json({ error: 'Administrator access required.' }, 403);
        const [orders, users, messages] = await Promise.all([env.DB!.prepare('SELECT * FROM orders ORDER BY created DESC').all(), env.DB!.prepare('SELECT id,name,email FROM users').all(), env.DB!.prepare('SELECT * FROM messages ORDER BY created DESC').all()]);
        return json({ orders: orders.results.map(orderForDisplay), users: users.results, messages: messages.results.map((m: any) => ({ ...JSON.parse(m.data), id: m.id, created: m.created })) });
    }
    return json({ error: 'Unknown action' }, 400);
}
catch {
    return json({ error: 'Store service is temporarily unavailable.' }, 503);
} }
export async function POST(req: Request) {
    try {
        if (req.headers.get('origin') && req.headers.get('origin') !== new URL(req.url).origin)
            return json({ error: 'Invalid origin' }, 403);
        const b = await req.json() as any;
        const db = env.DB!;
        const action = b.action;
        const s = await session(req);
        if (['login', 'register', 'admin-login', 'reset', 'contact', 'subscribe'].includes(action)) {
            const now = Date.now(), windowEnd = (Math.floor(now / 900000) + 1) * 900000;
            const key = action + ':' + (req.headers.get('cf-connecting-ip') || 'local') + ':' + Math.floor(now / 900000);
            await db.prepare('DELETE FROM attempts WHERE expires < ?').bind(now).run();
            await db.prepare('INSERT INTO attempts (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1').bind(key, windowEnd).run();
            const attempt = await db.prepare('SELECT count FROM attempts WHERE id=?').bind(key).first<any>();
            if (attempt.count > 20)
                return json({ error: 'Too many attempts. Please try again in 15 minutes.' }, 429);
        }
        if (action === 'logout') {
            const token = req.headers.get('cookie')?.match(/(?:^|;\s*)gf_session=([^;]+)/)?.[1];
            if (token)
                await db.prepare('DELETE FROM sessions WHERE id=?').bind(token).run();
            return json({ ok: true }, 200, { 'Set-Cookie': 'gf_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
        }
        if (action === 'register' || action === 'login' || action === 'admin-login') {
            let userId: string, role = 'customer';
            if (action === 'admin-login') {
                const secret = (env as any).ADMIN_PASSWORD;
                if (!secret)
                    return json({ error: 'Admin access must be configured by the store owner.' }, 503);
                if (String(b.email || '').trim().toLowerCase() !== 'admin@globalfashion.com' || b.password !== secret)
                    return json({ error: 'Invalid administrator credentials.' }, 401);
                userId = 'administrator';
                role = 'admin';
            }
            else {
                const email = String(b.email || '').trim().toLowerCase();
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof b.password !== 'string' || b.password.length < 8 || b.password.length > 128)
                    return json({ error: 'Enter a valid email and a password of 8–128 characters.' }, 400);
                if (action === 'register') {
                    if (!String(b.name || '').trim())
                        return json({ error: 'Your name is required.' }, 400);
                    if (await db.prepare('SELECT id FROM users WHERE email=?').bind(email).first())
                        return json({ error: 'An account already exists with this email.' }, 409);
                    userId = uid();
                    const salt = uid();
                    await db.prepare('INSERT INTO users (id,email,name,password,salt) VALUES (?,?,?,?,?)').bind(userId, email, String(b.name).slice(0, 100), await hash(b.password, salt), salt).run();
                }
                else {
                    const u = await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first<any>();
                    if (!u || await hash(b.password, u.salt) !== u.password)
                        return json({ error: 'Email or password is incorrect.' }, 401);
                    userId = u.id;
                }
            }
            const token = uid();
            await db.prepare('INSERT INTO sessions (id,user_id,expires,role) VALUES (?,?,?,?)').bind(token, userId, Date.now() + 604800000, role).run();
            return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, req) });
        }
        if (action === 'contact' || action === 'subscribe' || action === 'reset') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email || '')))
                return json({ error: 'Enter a valid email.' }, 400);
            await db.prepare('INSERT INTO messages (id,data,created) VALUES (?,?,?)').bind(uid(), JSON.stringify({ type: action, email: String(b.email).slice(0, 254), name: String(b.name || '').slice(0, 100), message: String(b.message || '').slice(0, 4000) }), new Date().toISOString()).run();
            return json({ ok: true });
        }
        if (!s)
            return json({ error: 'Please sign in to continue.' }, 401);
        if (action === 'profile') {
            if (s.role === 'admin')
                return json({ error: 'Use a customer account' }, 400);
            await db.prepare('UPDATE users SET name=?,address=? WHERE id=?').bind(String(b.name).slice(0, 100), String(b.address || '').slice(0, 1000), s.user_id).run();
            return json({ ok: true });
        }
        if (action === 'order') {
            if (s.role === 'admin')
                return json({ error: 'Use a customer account to order.' }, 400);
            if (!Array.isArray(b.items) || !b.items.length || b.items.length > 50)
                return json({ error: 'Your cart is empty or too large.' }, 400);
            for (const field of ['name', 'email', 'address', 'city', 'country', 'phone'])
                if (!String(b.shipping?.[field] || '').trim())
                    return json({ error: 'Complete all delivery details.' }, 400);
            const all = await allProducts();
            const items = [];
            for (const item of b.items) {
                const p = all.find(p => p.id === item.id);
                if (!p || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > p.stock || !getProductSizes(p).includes(item.size))
                    return json({ error: 'An item is unavailable. Please check your cart.' }, 400);
                items.push({ id: p.id, name: p.name, price: p.price, image: p.image, qty: item.qty, size: item.size });
            }
            const subtotal = items.reduce((a, p) => a + p.price * p.qty, 0);
            const discount = b.code === 'WELCOME10' ? Math.round(subtotal * 10) / 100 : 0;
            const shipping = subtotal >= 150 ? 0 : 8;
            const id = 'GF-' + uid().slice(0, 8).toUpperCase();
            const safeShipping = Object.fromEntries(['name', 'email', 'address', 'city', 'country', 'phone', 'postal'].map(f => [f, String(b.shipping[f] || '').slice(0, 400)]));
            const data = { items, shipping: safeShipping, subtotal, discount, delivery: shipping, total: subtotal - discount + shipping, payment: 'Cash on delivery' };
            const counts = new Map<string, number>();
            for (const item of items)
                counts.set(item.id, (counts.get(item.id) || 0) + item.qty);
            for (const [pid, n] of counts) {
                const p = all.find(p => p.id === pid)!;
                if (n > p.stock)
                    return json({ error: 'Not enough stock for this item.' }, 400);
                await db.prepare('INSERT INTO products (id,data) VALUES (?,?) ON CONFLICT(id) DO NOTHING').bind(pid, JSON.stringify(p)).run();
            }
            const checks = [...counts.keys()].map(() => "EXISTS (SELECT 1 FROM products WHERE id=? AND json_extract(data,'$.stock')>=?)").join(' AND ');
            const created = new Date().toISOString();
            const insert = db.prepare('INSERT INTO orders (id,user_id,data,status,created) SELECT ?,?,?,?,? WHERE ' + checks).bind(id, s.user_id, JSON.stringify(data), 'Processing', created, ...[...counts].flatMap(([pid, n]) => [pid, n]));
            const result = await db.batch([insert, ...[...counts].map(([pid, n]) => db.prepare("UPDATE products SET data=json_set(data,'$.stock',json_extract(data,'$.stock')-?) WHERE id=? AND EXISTS(SELECT 1 FROM orders WHERE id=?)").bind(n, pid, id))]);
            if (!result[0].meta.changes)
                return json({ error: 'An item has just sold out. Please review your bag.' }, 409);
            return json({ order: { ...data, id, status: 'Processing', created } });
        }
        if (s.role !== 'admin')
            return json({ error: 'Administrator access required.' }, 403);
        if (action === 'product') {
            const p = b.product as Product;
            if (p.category === 'Kids' && !['Boys', 'Girls', 'All'].includes(p.audience || 'All'))
                return json({ error: 'Choose Boys, Girls, or All kids.' }, 400);
            if (!p.id || !p.name || typeof p.name !== 'string' || p.name.length > 150 || !['Men', 'Women', 'Kids', 'Unisex'].includes(p.category) || !Number.isFinite(p.old) || p.old < 0 || !Number.isFinite(p.price) || p.price <= 0 || !Number.isInteger(p.stock) || p.stock < 0 || !(/^https:\/\//.test(p.image) || (Object.values(photoAssets).includes(p.image) || catalog.some(item => item.image === p.image))))
                return json({ error: 'Enter valid product details.' }, 400);
            await db.prepare('INSERT INTO products (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').bind(p.id, JSON.stringify(p)).run();
            return json({ ok: true });
        }
        if (action === 'status') {
            if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(b.status))
                return json({ error: 'Invalid status.' }, 400);
            await db.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status, b.id).run();
            return json({ ok: true });
        }
        return json({ error: 'Unknown action' }, 400);
    }
    catch {
        return json({ error: 'Unable to complete your request. Please try again.' }, 503);
    }
}
