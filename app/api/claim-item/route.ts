import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, userId } = body;

    if (!itemId || !userId) {
      return NextResponse.json(
        { error: 'Item ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the item details including handover location and contact email
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, title, user_id, category, handover_location_private, description, location, contact_email')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if item is a found item
    if (item.category !== 'found') {
      return NextResponse.json(
        { error: 'This item is not a found item' },
        { status: 400 }
      );
    }

    // Check if user is trying to claim their own item
    if (item.user_id === userId) {
      return NextResponse.json(
        { error: 'You cannot claim your own found item' },
        { status: 400 }
      );
    }

    // Note: We don't need sender info for the notification, just the message

    // Create notification message
    const notificationMessage = `Someone claims they lost the item: ${item.title}`;

    // Insert notification record using database function
    // This works even without service role key
    const { data: notificationData, error: notificationError } = await supabase
      .rpc('create_notification', {
        p_receiver_id: item.user_id, // The finder
        p_sender_id: userId, // The requester
        p_item_id: itemId,
        p_message: notificationMessage
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      console.error('Notification error details:', JSON.stringify(notificationError, null, 2));
      
      // Fallback: Try with service role key if available
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        console.log('Trying fallback with service role key...');
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('notifications')
          .insert({
            receiver_id: item.user_id,
            sender_id: userId,
            item_id: itemId,
            message: notificationMessage,
            read: false
          })
          .select()
          .single();
        
        if (fallbackError) {
          return NextResponse.json(
            { 
              error: 'Failed to create notification',
              details: fallbackError.message,
              code: fallbackError.code
            },
            { status: 500 }
          );
        }
        console.log('✅ Notification created successfully (fallback):', fallbackData?.id);
      } else {
        return NextResponse.json(
          { 
            error: 'Failed to create notification',
            details: notificationError.message,
            code: notificationError.code,
            hint: 'Database function may need to be created. Check migration: create_notification_function'
          },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Notification created successfully:', notificationData);
    }

    // Don't auto-send email - user will choose to send it when clicking notification
    return NextResponse.json({
      success: true,
      message: 'Your claim request has been sent to the finder. Check your notifications to send them an email with the handover location.',
      note: 'Click on the notification to send an email with the handover location to the finder.'
    });
  } catch (error) {
    console.error('Error processing claim request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

