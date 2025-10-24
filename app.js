import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { assert } from 'superstruct';
import {
  CreateOrder,
  CreateProduct,
  CreateUser,
  PatchOrder,
  PatchProduct,
  PatchUser
} from './structs.js';

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
    take: parseInt(limit) || undefined,
    include: { userPreference: true }
  });

  if (users.length != 0) {
    res.status(200).send(users);
  } else {
    res.status(404).send('No users found.');
  }
});

app.get('/users/:id', async (req, res) => {
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { userPreference: true }
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send('No user found by a given ID.');
  }
});

app.post('/users', async (req, res) => {
  try {
    assert(req.body, CreateUser);
    const { userPreference, ...userFields } = req.body;
    const email = req.body.email;
    if (await prisma.user.count({ where: { email } })) {
      return res.status(422).send('Same email exists.');
    }

    const user = await prisma.user.create({
      data: {
        ...userFields,
        userPreference: { create: userPreference }
      },
      include: { userPreference: true }
    });
    res.status(201).send(user);
  } catch (e) {
    console.log(e);
    return res.status(422).send('Validation failed.');
  }
});

app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    assert(req.body, PatchUser);
    if ((await prisma.user.count({ where: { id } })) != 1) {
      return res.status(404).send('No user found by a given ID.');
    }
    const { userPreference, ...userFields } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userFields,
        userPreference: { update: userPreference }
      },
      include: { userPreference: true }
    });
    res.send(user);
  } catch (e) {
    console.log(e);
    return res.status(422).send('Validation failed.');
  }
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  if ((await prisma.user.count({ where: { id } })) == 1) {
    const user = await prisma.user.delete({ where: { id } });
    console.log('User deleted.');
    res.send(user);
  } else {
    res.status(404).send('No user found by a given ID.');
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
    take: parseInt(limit) || undefined
  });

  if (products.length != 0) {
    res.send(products);
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
    res.status(404).send('No product found by a given ID.');
  }
});

app.post('/products', async (req, res) => {
  const data = req.body;
  try {
    assert(data, CreateProduct);
    const product = await prisma.product.create({ data });
    res.send(product);
  } catch (e) {
    console.log(e);
    return res.status(422).send('Validation failed.');
  }
});

app.patch('/products/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    assert(data, PatchProduct);
    if ((await prisma.product.count({ where: { id } })) != 1) {
      return res.status(404).send('No product found by a given ID.');
    }
    const product = await prisma.product.update({ where: { id }, data });
    res.send(product);
  } catch (e) {
    console.log(e);
    return res.status(422).send('Validation failed.');
  }
});

app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  if ((await prisma.product.count({ where: { id } })) != 1) {
    return res.status(404).send('No product found by a given ID.');
  }
  const product = await prisma.product.delete({ where: { id } });
  console.log('Product deleted.');
  res.send(product);
});

//----------------------------- rout hander: orders
app.get('/orders', async (req, res) => {
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

  //const orders = await prisma.order.findMany();
  const orders = await prisma.order.findMany({
    orderBy,
    skip: parseInt(offset),
    take: parseInt(limit) || undefined,
    include: { orderItems: true }
  });

  if (orders.length > 0) {
    res.send(orders);
  } else {
    res.send('No orders made.');
  }
});

app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { orderItems: true }
  });

  if (order) {
    res.send(order);
  } else {
    res.status(404).send('No order found by a given ID.');
  }
});

app.post('/orders', async (req, res) => {
  try {
    assert(req.body, CreateOrder);
    const { orderItems, ...orderProperties } = req.body;

    // extract productIds & associated quatity from orderItems array
    const productIds = orderItems.map((orderItem) => orderItem.productId);

    function getQuantity(productId) {
      const orderItem = orderItems.find((orderItem) => orderItem.productId === productId);
      return orderItem.quantity;
    }

    // check if there is enough stock )
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const isSufficientStock = products.every((product) => {
      const { id, stock } = product;
      return stock >= getQuantity(id);
    });
    // cancel the order if there is any item with insufficient stock
    if (!isSufficientStock) {
      return res.status(500).send('Insufficient stock');
    }

    // update quantity: reduce stodck by order, use async functions in parallel
    await Promise.all(
      productIds.map((id) => {
        return prisma.product.update({
          where: { id },
          data: { stock: { decrement: getQuantity(id) } }
        });
      })
    );

    // create order
    const order = await prisma.order.create({
      data: {
        // user: {
        //   connect: { id: orderProperties.userId }
        // },
        ...orderProperties,
        orderItems: { create: orderItems }
      },
      include: { orderItems: true }
    });
    res.send(order);
  } catch (e) {
    res.status(422).send('Validation failed');
  }
});

app.patch('/orders/:id', async (req, res) => {
  try {
    assert(req.body, PatchOrder);
  } catch (e) {
    res.status(422).send('Validation failed.');
  }

  const { id } = req.params;
  if ((await prisma.order.count({ where: { id } })) != 1) {
    return res.status(404).send('No order found by a given ID.');
  }
  const { orderItems, ...otherProperties } = req.body;
  const order = await prisma.order.update({
    where: { id },
    data: {
      ...otherProperties,
      orderItems: { update: orderItems }
    },
    include: { orderItems: true }
  });
  res.send(order);
});

app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  if ((await prisma.order.count({ where: { id } })) != 1) {
    return res.status(404).send('No order found by a given ID.');
  }
  const order = await prisma.order.delete({ where: { id } });
  console.log('Order deleted.');
  res.send(order);
});

app.listen(process.env.PORT || 3000, () => console.log(`Server started`));
