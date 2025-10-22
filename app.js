import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

//----------------------------- rout hander: products
app.get('/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.send(products);
});

app.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({ where: { id } });
  if (product) {
    res.send(product);
  } else {
    res.send('No such product_ID exists.');
  }
});

app.post('/products', async (req, res) => {
  const data = req.body;
  const product = await prisma.product.create({ data });
  res.send(product);
});

app.patch('/products/:id', async (req, res) => {
  const id = req.params.id;
  if ((await prisma.product.count({ where: { id } })) == 1) {
    const data = req.body;
    const product = await prisma.product.update({ where: { id }, data });
    res.send(product);
  } else {
    res.status(404).send('No such product_ID exists.');
  }
});

app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  if (await prisma.product.count({ where: { id } })) {
    const product = await prisma.product.delete({ where: { id } });
    res.send(product);
  } else {
    res.send('No such product_ID exists.');
  }
});

//----------------------------- rout hander: users
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.send(users);
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
  const data = req.body;
  const email = data.email;
  if (await prisma.user.count({ where: { email } })) {
    res.status(404).send('Same email exists in DB.');
  } else {
    const user = await prisma.user.create({ data });
    res.status(201).send(user);
  }
});

app.patch('/users/:id', async (req, res) => {
  //const {id} = req.params;
  const id = req.params.id;
  if (await prisma.user.count({ where: { id } })) {
    const data = req.body;
    const user = await prisma.user.update({ where: { id }, data });
    res.send(user);
  } else {
    res.status(404).send('No such user_ID exists.');
  }
});

app.delete('/users/:id', async (req, res) => {
  //const {id} = req.params;
  const id = req.params.id;
  if (await prisma.user.count({ where: { id } })) {
    const user = await prisma.user.delete({ where: { id } });
    res.send(user);
  } else {
    res.status(404).send('No such user_ID exists.');
  }
});

app.listen(process.env.PORT || 3000, () => console.log(`Server started`));
