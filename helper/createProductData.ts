export default (product, opts: Record<string, any> = {}) => {
  return {
    sku: product.sku,
    productId: product.sku,
    variantId: [product.sku],
    price: product.price,
    quantity: product.qty || opts.qty
  }
}
