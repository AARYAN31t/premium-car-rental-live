import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'cars-bookings.json');
const DATA_DIR = path.dirname(DATA_FILE);

const defaultState = {
  cars: [
    {
      _id: 'car-1',
      id: 'car-1',
      make: 'Tesla',
      model: 'Model S',
      name: 'Tesla Model S',
      year: 2023,
      category: 'Luxury',
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Electric',
      mileage: 0,
      dailyRate: 180,
      price: 180,
      status: 'available',
      image: '',
      description: 'Premium electric sedan available for daily rental.'
    },
    {
      _id: 'car-2',
      id: 'car-2',
      make: 'BMW',
      model: 'M5',
      name: 'BMW M5',
      year: 2022,
      category: 'Sports',
      seats: 5,
      transmission: 'Automatic',
      fuelType: 'Petrol',
      mileage: 14,
      dailyRate: 160,
      price: 160,
      status: 'available',
      image: '',
      description: 'High-performance luxury sports sedan.'
    }
  ],
  bookings: []
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2));
}

function readState() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      cars: Array.isArray(parsed.cars) ? parsed.cars : defaultState.cars,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : []
    };
  } catch (error) {
    console.error('Failed to read data file, resetting to defaults.', error);
    return { ...defaultState };
  }
}

function writeState(state) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const contentType = req.headers['content-type'] || '';

      if (!body) {
        resolve({});
        return;
      }

      if (contentType.includes('application/json')) {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
        return;
      }

      resolve({});
    });
    req.on('error', reject);
  });
}

function normalizeCarPayload(input = {}) {
  const make = input.make || input.carName || input.name || '';
  const model = input.model || '';
  const name = input.name || `${make} ${model}`.trim();
  const dailyRate = Number(input.dailyRate ?? input.price ?? 0);
  const mileage = Number(input.mileage ?? 0);
  const seats = Number(input.seats ?? 4);
  const year = Number(input.year ?? 0);

  return {
    _id: input._id || input.id || `car-${Date.now()}`,
    id: input.id || input._id || `car-${Date.now()}`,
    make,
    model,
    name,
    year,
    category: input.category || 'Sedan',
    seats,
    transmission: input.transmission || 'Automatic',
    fuelType: input.fuelType || input.fuel || 'Gasoline',
    mileage,
    dailyRate,
    price: dailyRate || Number(input.price ?? 0),
    status: input.status || 'available',
    image: input.image || input._rawImage || '',
    description: input.description || ''
  };
}

function normalizeBookingPayload(input = {}) {
  const id = input._id || input.id || `booking-${Date.now()}`;
  return {
    _id: id,
    id,
    customer: input.customer || input.customerName || input.name || 'Demo User',
    email: input.email || '',
    phone: input.phone || '',
    car: input.car?.name || input.carName || input.car || '',
    carImage: input.carImage || input.image || '',
    pickupDate: input.pickupDate || '',
    returnDate: input.returnDate || '',
    bookingDate: input.bookingDate || new Date().toISOString(),
    status: input.status || 'pending',
    amount: input.amount ?? 0,
    details: input.details || {},
    address: input.address || {},
    userId: input.userId || null
  };
}

const server = http.createServer(async (req, res) => {
  const { method, url = '/' } = req;
  const parsedUrl = new URL(url, `http://${req.headers.host}`);

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (parsedUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'local-car-api' });
    return;
  }

  if (method === 'GET' && parsedUrl.pathname === '/api/cars') {
    const state = readState();
    const limit = Number(parsedUrl.searchParams.get('limit')) || state.cars.length;
    const cars = state.cars.slice(0, limit);
    sendJson(res, 200, { data: cars });
    return;
  }

  if (method === 'GET' && /^\/api\/cars\//.test(parsedUrl.pathname)) {
    const state = readState();
    const id = parsedUrl.pathname.split('/').pop();
    const car = state.cars.find((item) => String(item._id) === id || String(item.id) === id);
    if (!car) {
      sendJson(res, 404, { message: 'Car not found' });
      return;
    }
    sendJson(res, 200, { data: car });
    return;
  }

  if (method === 'POST' && parsedUrl.pathname === '/api/cars') {
    try {
      const body = await parseBody(req);
      const state = readState();
      const car = normalizeCarPayload(body);
      state.cars.unshift(car);
      writeState(state);
      sendJson(res, 201, { data: car, message: 'Car created' });
    } catch (error) {
      console.error('Failed to create car', error);
      sendJson(res, 500, { message: 'Failed to create car' });
    }
    return;
  }

  if (method === 'PUT' && /^\/api\/cars\//.test(parsedUrl.pathname)) {
    try {
      const body = await parseBody(req);
      const state = readState();
      const id = parsedUrl.pathname.split('/').pop();
      const index = state.cars.findIndex((item) => String(item._id) === id || String(item.id) === id);
      if (index === -1) {
        sendJson(res, 404, { message: 'Car not found' });
        return;
      }
      const updated = normalizeCarPayload({ ...state.cars[index], ...body, _id: state.cars[index]._id, id: state.cars[index].id });
      state.cars[index] = updated;
      writeState(state);
      sendJson(res, 200, { data: updated, message: 'Car updated' });
    } catch (error) {
      console.error('Failed to update car', error);
      sendJson(res, 500, { message: 'Failed to update car' });
    }
    return;
  }

  if (method === 'DELETE' && /^\/api\/cars\//.test(parsedUrl.pathname)) {
    try {
      const state = readState();
      const id = parsedUrl.pathname.split('/').pop();
      state.cars = state.cars.filter((item) => String(item._id) !== id && String(item.id) !== id);
      writeState(state);
      sendJson(res, 200, { message: 'Car deleted' });
    } catch (error) {
      console.error('Failed to delete car', error);
      sendJson(res, 500, { message: 'Failed to delete car' });
    }
    return;
  }

  if (method === 'GET' && parsedUrl.pathname === '/api/bookings') {
    const state = readState();
    const limit = Number(parsedUrl.searchParams.get('limit')) || state.bookings.length;
    const bookings = state.bookings.slice(0, limit);
    sendJson(res, 200, { data: bookings });
    return;
  }

  if (method === 'POST' && parsedUrl.pathname === '/api/payments/create-checkout-session') {
    try {
      const body = await parseBody(req);
      const state = readState();
      const booking = normalizeBookingPayload(body);
      state.bookings.unshift(booking);
      writeState(state);
      sendJson(res, 200, { success: true, booking, message: 'Booking saved locally' });
    } catch (error) {
      console.error('Failed to save booking', error);
      sendJson(res, 500, { message: 'Failed to save booking' });
    }
    return;
  }

  if (method === 'PATCH' && /^\/api\/bookings\//.test(parsedUrl.pathname)) {
    try {
      const body = await parseBody(req);
      const state = readState();
      const id = parsedUrl.pathname.split('/')[3];
      const index = state.bookings.findIndex((item) => String(item._id) === id || String(item.id) === id);
      if (index === -1) {
        sendJson(res, 404, { message: 'Booking not found' });
        return;
      }
      state.bookings[index] = { ...state.bookings[index], ...body, status: body.status || state.bookings[index].status };
      writeState(state);
      sendJson(res, 200, { data: state.bookings[index] });
    } catch (error) {
      console.error('Failed to update booking', error);
      sendJson(res, 500, { message: 'Failed to update booking' });
    }
    return;
  }

  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ message: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Local car API listening on http://localhost:${PORT}`);
});
