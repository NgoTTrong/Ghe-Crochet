-- Insert sample categories
INSERT INTO categories (name, description) VALUES
  ('Amigurumi', 'Cute stuffed animals and characters'),
  ('Bags & Accessories', 'Handmade bags, purses, and accessories'),
  ('Home Decor', 'Decorative items for your home'),
  ('Baby Items', 'Soft and safe items for babies'),
  ('Seasonal', 'Holiday and seasonal decorations')
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, category, images, materials, size_info, care_instructions, is_featured, is_available) VALUES
  (
    'Cute Bear Amigurumi',
    'Adorable handmade teddy bear perfect for cuddling. Made with love and attention to detail.',
    350000,
    'Amigurumi',
    ARRAY['/placeholder.svg?height=400&width=400'],
    'Cotton yarn, polyester filling, safety eyes',
    'Height: 25cm, Width: 20cm',
    'Hand wash with mild soap, air dry only',
    true,
    true
  ),
  (
    'Pastel Tote Bag',
    'Stylish and practical tote bag in soft pastel colors. Perfect for daily use.',
    280000,
    'Bags & Accessories',
    ARRAY['/placeholder.svg?height=400&width=400'],
    'Cotton yarn, fabric lining',
    '35cm x 30cm x 10cm',
    'Machine wash cold, gentle cycle',
    true,
    true
  ),
  (
    'Flower Wall Hanging',
    'Beautiful decorative wall hanging with delicate crocheted flowers.',
    420000,
    'Home Decor',
    ARRAY['/placeholder.svg?height=400&width=400'],
    'Cotton yarn, wooden hoop',
    'Diameter: 30cm',
    'Dust gently, spot clean if needed',
    false,
    true
  ),
  (
    'Baby Blanket Set',
    'Soft and cozy baby blanket with matching hat. Perfect gift for newborns.',
    480000,
    'Baby Items',
    ARRAY['/placeholder.svg?height=400&width=400'],
    'Baby-safe cotton yarn',
    'Blanket: 80cm x 80cm, Hat: 0-6 months',
    'Machine wash warm, tumble dry low',
    true,
    true
  ),
  (
    'Christmas Tree Ornaments',
    'Set of 6 handmade Christmas ornaments in festive colors.',
    180000,
    'Seasonal',
    ARRAY['/placeholder.svg?height=400&width=400'],
    'Acrylic yarn, ribbon',
    'Each ornament: 8-10cm',
    'Hand wash, air dry',
    false,
    true
  );
