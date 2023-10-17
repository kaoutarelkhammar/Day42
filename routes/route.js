const express=require("express")
const route= express.Router()
const products= require("../models/products")
const {run}=require('../db')
route.get('/home', (req, res) => {
    res.render('home', {products});
  });

route.get("/", async (req,res)=>{
      try {
            const db = await run();
            const phones = await db.collection("phones").find().toArray();
            res.send(phones); 
          } catch (error) {
            console.error(error);
            res.status(500).send("Internal server error");
          }
})


route.post("/", async (req, res) => {
      try {
        const { name, description, price, image } = req.body;
        const db = await run();
    
        const newProduct = {
          name,
          description,
          price,
          image
        };
    
        // Insert the new product into the database
        const result = await db.collection("phones").insertOne(newProduct);
        console.log(`A document was inserted with the _id: ${result.insertedId}`);
    
        // Send the response after the database operation is complete
        res.status(201).json(newProduct);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
      }
    });
    

route.put("/:id",(req,res)=>{
      const {id} = req.params
      const {name, price} = req.body

      const productIndex = products.findIndex((product)=>product.id===parseInt(id))
      
      const updateProduct= {
            ...products[productIndex],
            name:name,
            price:price
      }
      console.log(updateProduct)
      products[productIndex] = updateProduct;

      res.json(updateProduct)
})

route.delete("/",async (req,res)=>{


      const db= await run()

      const phones = await db.collection("phones").deleteMany()
      console.log(phones);
      res.send(phones)

      }
)
route.delete("/:name",async (req,res)=>{

      const {name} = req.params
      const db= await run()
      const Product= {
            name:name,
            
      }
      const phone = await db.collection("phones").deleteOne(Product)
    
      res.send(phone)

      }
)
route.get("/advancedSearch", async (req, res)=>{
      const {minPrice, maxPrice, category, available}= req.query;
      const query = {};

      if (minPrice && maxPrice) {
            query.price = {
              $gte: parseFloat(minPrice),
              $lte: parseFloat(maxPrice),
            };
          } else if (minPrice) {
            query.price = { $gte: parseFloat(minPrice) };
          } else if (maxPrice) {
            query.price = { $lte: parseFloat(maxPrice) };
          }
          if (category) {
            // Create a regex pattern for the category with 'i' flag for case-insensitivity
            query.category ={ $regex :new RegExp(category, 'i')};
          }
          
          if (available === "true") {
            query.availability = true;
          } else if (available === "false") {
            query.availability = false;
          }
          try {
            const db = await run();
            const Products = await db.collection("phones").find(query).toArray();
           res.render("AdvancedSearch", {Products})
            //  res.send(Products);
          } catch (error) {
            console.error(error);
            res.status(500).send("Internal server error");
          }
})
// Create a text index on the "name" and "description" fields
async function createTextIndex() {
  const db = await run();
  await db.collection('phones').createIndex({ name: 'text', description: 'text' });
}

 // This will create the index when your application starts

// Define the route to handle text searches
route.get("/text-search", async (req, res) => {
  createTextIndex();
  const { query } = req.query;

  try {
    const db = await run();

    // Use the $text operator to perform a text search on "name" and "description" fields
    const Products = await db
      .collection("phones")
      .find({ $text: { $search: query } })
      .toArray();

    // res.send(Products);
    res.render("AdvancedSearch", {Products})
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});


// Other routes and middleware



module.exports = route