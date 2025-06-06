const Joi = require("joi");

const validator = (schema) =>(payload)=>
    schema.validate(payload, { abortEarly: false });


const productValidationSchema = Joi.object({
  shop: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().required(),
  category: Joi.string().required(), 
  // category: Joi.array().items(Joi.string()).optional(),  // Accepting array of strings
  quantity: Joi.number().required().min(1),
  productImage: Joi.string().optional(),
  sold: Joi.number().optional(),
  estimatedTime: Joi.string().optional(),
  deliveryOption: Joi.string().optional(),
  productType: Joi.string().required(),

  // Added userId and adminId validation
  userId: Joi.string().optional().allow(null),      // Accepts string or null
  adminId: Joi.string().optional().allow(null),      // Accepts string or null

  // Add favorite field validation
  favorite: Joi.boolean().optional() 
});



const cartValidationSchema = Joi.object({
    // userId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        totalAmount: Joi.number().integer().min(1).required(),
      })
    ), 
  });

const userValidationSchema = Joi.object({
  id:Joi.string().optional(),
  name:Joi.string().optional().min(3),
  mobileNumber:Joi.number().min(10),
  password:Joi.string().min(4),
  state:Joi.string().optional(),
  place:Joi.string().optional(),
  pincode:Joi.string().optional()
})

exports.validateProductSchema = validator(productValidationSchema);
exports.validateCartSchema = validator(cartValidationSchema);
exports.validateUserSchema = validator(userValidationSchema)