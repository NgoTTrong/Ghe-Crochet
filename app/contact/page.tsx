import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Heart, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='text-center space-y-4 mb-12'>
            <Badge className='bg-primary text-primary-foreground'>
              <Heart className='w-3 h-3 mr-1' />
              Liên hệ với chúng tôi
            </Badge>
            <h1 className='text-3xl lg:text-4xl font-bold'>
              Hãy kể cho chúng tôi nghe ý tưởng của bạn
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
              Chúng tôi luôn sẵn sàng lắng nghe và biến ý tưởng của bạn thành
              những sản phẩm handmade độc đáo
            </p>
          </div>

          {/* Contact Information */}
          <div className='max-w-4xl mx-auto'>
            {/* Contact Information */}
            <div className='space-y-6'>
              <div className='space-y-4 text-center'>
                <h2 className='text-2xl font-bold'>Thông tin liên hệ</h2>
                <p className='text-muted-foreground'>
                  Liên hệ trực tiếp với chúng tôi qua các kênh sau để được tư
                  vấn nhanh nhất:
                </p>
              </div>

              <div className='grid md:grid-cols-2 gap-6'>
                {/* Contact Details */}
                <Card className='border-0 cute-shadow'>
                  <CardContent className='p-6 space-y-6'>
                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                        <MapPin className='w-6 h-6 text-primary' />
                      </div>
                      <div className='space-y-1'>
                        <h3 className='font-semibold'>Địa chỉ</h3>
                        <p className='text-muted-foreground'>
                          Thôn Phước Sơn Xã Phước Đồng, Nha Trang, Vietnam
                        </p>
                      </div>
                    </div>

                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0'>
                        <Phone className='w-6 h-6 text-secondary' />
                      </div>
                      <div className='space-y-1'>
                        <h3 className='font-semibold'>Điện thoại</h3>
                        <p className='text-muted-foreground'>0865180495</p>
                      </div>
                    </div>

                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0'>
                        <Mail className='w-6 h-6 text-accent' />
                      </div>
                      <div className='space-y-1'>
                        <h3 className='font-semibold'>Email</h3>
                        <p className='text-muted-foreground'>
                          xlam.design@gmail.com
                        </p>
                      </div>
                    </div>

                    <div className='flex items-start gap-4'>
                      <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0'>
                        <Clock className='w-6 h-6 text-primary' />
                      </div>
                      <div className='space-y-1'>
                        <h3 className='font-semibold'>Giờ làm việc</h3>
                        <div className='text-muted-foreground space-y-1'>
                          <p>Thứ 2 - Thứ 6: 9:00 - 18:00</p>
                          <p>Thứ 7 - Chủ nhật: 9:00 - 17:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Contact Actions */}
                <Card className='border-0 cute-shadow bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5'>
                  <CardContent className='p-6'>
                    <div className='space-y-4'>
                      <h3 className='font-semibold'>Liên hệ nhanh</h3>
                      <p className='text-sm text-muted-foreground'>
                        Bạn đã có ý tưởng cụ thể? Liên hệ ngay để được tư vấn và
                        báo giá!
                      </p>
                      <div className='grid grid-cols-2 gap-3'>
                        <Button
                          size='sm'
                          className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                          asChild
                        >
                          <Link href='tel:0865180495'>
                            <Phone className='w-4 h-4 mr-2' />
                            Gọi ngay
                          </Link>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='rounded-full bg-transparent'
                          asChild
                        >
                          <Link href='mailto:xlam.design@gmail.com'>
                            <Mail className='w-4 h-4 mr-2' />
                            Email
                          </Link>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='rounded-full bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                          asChild
                        >
                          <Link href='https://zalo.me/0865180495'>
                            <MessageCircle className='w-4 h-4 mr-2' />
                            Zalo
                          </Link>
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='rounded-full bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                          asChild
                        >
                          <Link href='https://www.facebook.com/ghecrochet'>
                            <svg
                              viewBox='0 0 24 24'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <g id='SVGRepo_bgCarrier' strokeWidth='0'></g>
                              <g
                                id='SVGRepo_tracerCarrier'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              ></g>
                              <g id='SVGRepo_iconCarrier'>
                                <path
                                  fillRule='evenodd'
                                  clipRule='evenodd'
                                  d='M20 1C21.6569 1 23 2.34315 23 4V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H20ZM20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H15V13.9999H17.0762C17.5066 13.9999 17.8887 13.7245 18.0249 13.3161L18.4679 11.9871C18.6298 11.5014 18.2683 10.9999 17.7564 10.9999H15V8.99992C15 8.49992 15.5 7.99992 16 7.99992H18C18.5523 7.99992 19 7.5522 19 6.99992V6.31393C19 5.99091 18.7937 5.7013 18.4813 5.61887C17.1705 5.27295 16 5.27295 16 5.27295C13.5 5.27295 12 6.99992 12 8.49992V10.9999H10C9.44772 10.9999 9 11.4476 9 11.9999V12.9999C9 13.5522 9.44771 13.9999 10 13.9999H12V21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20Z'
                                  fill='#155dfc'
                                ></path>{' '}
                              </g>
                            </svg>
                            Facebook
                          </Link>
                        </Button>
                        {/* <Button
                          variant='outline'
                          size='sm'
                          className='rounded-full bg-red-500 text-white border-0 hover:bg-red-600'
                          asChild
                        >
                          <Link href='#' className='flex items-center gap-2'>
                            <svg
                              className='w-4 h-4'
                              viewBox='0 0 24 24'
                              fill='currentColor'
                            >
                              <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' />
                            </svg>
                            YouTube
                          </Link>
                        </Button> */}
                      </div>

                      <p className='text-sm text-muted-foreground flex flex-col gap-1 items-start'>
                        <span>🎥 Xem video hướng dẫn móc len</span>
                        <span>📸 Ảnh sản phẩm mới nhất</span>
                        <span>💬 Tương tác trực tiếp với chúng tôi</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <section className='py-16'>
            <div className='text-center space-y-4 mb-12'>
              <h2 className='text-2xl lg:text-3xl font-bold'>
                Câu hỏi thường gặp
              </h2>
              <p className='text-muted-foreground'>
                Một số câu hỏi khách hàng thường quan tâm
              </p>
            </div>

            <div className='grid md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <Card className='border-0 cute-shadow'>
                <CardContent className='p-6 space-y-3'>
                  <h3 className='font-semibold'>
                    Thời gian hoàn thành đơn hàng?
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Thời gian hoàn thành phụ thuộc vào độ phức tạp của sản phẩm,
                    thường từ 3-14 ngày làm việc.
                  </p>
                </CardContent>
              </Card>

              <Card className='border-0 cute-shadow'>
                <CardContent className='p-6 space-y-3'>
                  <h3 className='font-semibold'>
                    Có nhận đặt hàng theo yêu cầu không?
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Có! Chúng tôi nhận đặt hàng theo yêu cầu riêng. Hãy mô tả ý
                    tưởng và chúng tôi sẽ báo giá cho bạn.
                  </p>
                </CardContent>
              </Card>

              <Card className='border-0 cute-shadow'>
                <CardContent className='p-6 space-y-3'>
                  <h3 className='font-semibold'>Phương thức thanh toán?</h3>
                  <p className='text-sm text-muted-foreground'>
                    Chúng tôi nhận thanh toán qua chuyển khoản ngân hàng, ví
                    điện tử hoặc tiền mặt khi giao hàng.
                  </p>
                </CardContent>
              </Card>

              <Card className='border-0 cute-shadow'>
                <CardContent className='p-6 space-y-3'>
                  <h3 className='font-semibold'>
                    Có giao hàng toàn quốc không?
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Có! Chúng tôi giao hàng toàn quốc qua các đơn vị vận chuyển
                    uy tín với phí ship hợp lý.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
