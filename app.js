const express = require('express')
const app = express()
const morgan = require('morgan')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv/config')

const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')
app.use(cors())
app.options('*', cors())

//Middleware
app.use(express.json())
app.use(morgan('tiny'))
app.use(authJwt())
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))
app.use(errorHandler)


//Routers
const categoryRouter = require('./routes/category')
const productsRouter = require('./routes/products')
const usersRouter = require('./routes/user');
const orderRouter = require('./routes/orders')


const api = process.env.API_URL

app.use(`${api}/products`, productsRouter)
app.use(`${api}/orders`, orderRouter)
app.use(`${api}/categories`, categoryRouter)
app.use(`${api}/users`, usersRouter)

mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database'
})
    .then(() => {
        console.log('Database Connection is ready...')
    })
    .catch((err) => {
        console.log(err);
    })

app.listen(3000, () => {
    console.log(api);
    console.log('Server is running !!');
})

