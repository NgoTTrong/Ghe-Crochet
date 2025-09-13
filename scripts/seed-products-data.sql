-- Insert sample categories
INSERT INTO categories (id, name, description, created_at) VALUES
  (gen_random_uuid(), 'Túi xách', 'Các loại túi xách handmade', NOW()),
  (gen_random_uuid(), 'Mũ len', 'Mũ len đan tay', NOW()),
  (gen_random_uuid(), 'Khăn quàng', 'Khăn quàng cổ và khăn choàng', NOW()),
  (gen_random_uuid(), 'Đồ chơi', 'Đồ chơi amigurumi', NOW()),
  (gen_random_uuid(), 'Phụ kiện', 'Các phụ kiện handmade khác', NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (id, name, description, category, price, is_available, is_featured, images, materials, size_info, care_instructions, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Túi tote hoa cúc', 'Túi tote xinh xắn với họa tiết hoa cúc đáng yêu', 'Túi xách', 250000, true, true, ARRAY['/placeholder.svg?height=400&width=400'], 'Cotton 100%', '30x35x10cm', 'Giặt tay với nước lạnh', NOW(), NOW()),
  (gen_random_uuid(), 'Mũ len gấu brown', 'Mũ len hình gấu brown siêu dễ thương', 'Mũ len', 180000, true, true, ARRAY['/placeholder.svg?height=400&width=400'], 'Len acrylic mềm mại', 'Free size (52-58cm)', 'Giặt tay nhẹ nhàng', NOW(), NOW()),
  (gen_random_uuid(), 'Khăn quàng cổ pastel', 'Khăn quàng cổ màu pastel nhẹ nhàng', 'Khăn quàng', 150000, true, false, ARRAY['/placeholder.svg?height=400&width=400'], 'Cotton blend', '150x20cm', 'Có thể giặt máy ở chế độ nhẹ', NOW(), NOW()),
  (gen_random_uuid(), 'Gấu bông amigurumi', 'Gấu bông đan tay theo phong cách amigurumi', 'Đồ chơi', 320000, true, true, ARRAY['/placeholder.svg?height=400&width=400'], 'Len cotton, bông PP', '25cm cao', 'Giặt tay, không vắt mạnh', NOW(), NOW()),
  (gen_random_uuid(), 'Móc khóa hoa sen', 'Móc khóa hình hoa sen mini đáng yêu', 'Phụ kiện', 45000, true, false, ARRAY['/placeholder.svg?height=400&width=400'], 'Len cotton, khoen kim loại', '8x8cm', 'Lau sạch bằng khăn ẩm', NOW(), NOW()),
  (gen_random_uuid(), 'Túi đeo chéo vintage', 'Túi đeo chéo phong cách vintage cổ điển', 'Túi xách', 280000, true, false, ARRAY['/placeholder.svg?height=400&width=400'], 'Cotton và da PU', '20x15x8cm', 'Giặt tay phần vải, lau da bằng khăn ẩm', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
