import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { assert } from 'superstruct';
import { CreateProduct, CreateUser, PatchProduct, PatchUser } from './structs.js';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

//----------------------------- rout hander: users
app.get('/users', async (req, res) => {
  const { offset = 0, limit = 0, order = 'newest' } = req.query;
  let orderBy;
  switch (order) {
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const users = await prisma.user.findMany({
    orderBy,
    skip: parseInt(offset),
    take: parseInt(limit),
  });

  if (users.length != 0) {
    res.status(200).send(users);
  } else {
    res.status(404).send('No users found.');
  }
});

app.get('/users/:id', async (req, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({ where: { id } });
  console.log(user);
  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'No such user_ID exists.' });
  }
});

app.post('/users', async (req, res) => {
  assert(req.body, CreateUser);
  const { userPreference, ...userFields } = req.body;
  const user = await prisma.user.create({
    data: {
      ...userFields,
      userPreference: {
        create: userPreference,
      },
    },
    include: {
      // Users in DB don't have userPreference property saved.
      userPreference: true, //Thus add it before sending 'user'
    },
  });
  res.status(201).send(user);

  // const data = req.body;
  // const email = data.email;
  // if (await prisma.user.count({ where: { email } })) {
  //   res.status(404).send('Same email exists in DB.');
  // } else {
  //   const user = await prisma.user.create({ data });
  //   res.status(201).send(user);
  // }
});

app.patch('/users/:id', async (req, res) => {
  //const {id} = req.params;
  const id = req.params.id;
  const data = req.body;
  try {
    assert(data, PatchUser);
  } catch (e) {
    console.log(e);
    return res.status(400).send('Wrong format');
  }

  if ((await prisma.user.count({ where: { id } })) == 1) {
    const user = await prisma.user.update({ where: { id }, data });
    res.send(user);
  } else {
    res.status(404).send('No such user_ID exists.');
  }
});

app.delete('/users/:id', async (req, res) => {
  //const {id} = req.params;
  const id = req.params.id;
  if ((await prisma.user.count({ where: { id } })) == 1) {
    const user = await prisma.user.delete({ where: { id } });
    res.send(user);
  } else {
    res.status(404).send('No such user_ID exists.');
  }
});

//----------------------------- rout hander: products
app.get('/products', async (req, res) => {
  const { offset = 0, limit = 0, order = 'newest', category } = req.query;
  let orderBy;
  switch (order) {
    case 'priceLowest':
      orderBy = { price: 'asc' };
      break;
    case 'priceHighest':
      orderBy = { price: 'desc' };
      break;
    case 'oldest':
      orderBy = { createdAt: 'asc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    default:
      orderBy = { createdAt: 'desc' };
  }

  const where = category ? { category } : { category: {} };
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: parseInt(offset),
    take: parseInt(limit),
  });

  if (products.length != 0) {
    res.status(200).send(products);
  } else {
    res.status(404).send('No products found.');
  }
});

app.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({ where: { id } });
  if (product) {
    res.status(200).send(product);
  } else {
    res.status(404).send('No such product_ID exists.');
  }
});

app.post('/products', async (req, res) => {
  const data = req.body;
  try {
    assert(data, CreateProduct);
  } catch (e) {
    console.log(e);
    return res.status(400).send('Wrong format');
  }

  const product = await prisma.product.create({ data });
  res.status(201).send(product);
});

app.patch('/products/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  assert(data, PatchProduct);

  if ((await prisma.product.count({ where: { id } })) == 1) {
    const product = await prisma.product.update({ where: { id }, data });
    res.status(201).send(product);
  } else {
    res.status(404).send('No such product_ID exists.');
  }
});

app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  if ((await prisma.product.count({ where: { id } })) == 1) {
    const product = await prisma.product.delete({ where: { id } });
    res.send(product);
  } else {
    res.status(404).send('No such product_ID exists.');
  }
});

app.listen(process.env.PORT || 3000, () => console.log(`Server started`));
