#include <pebble.h>

Window *window;	
uint8_t *img;
uint8_t img_chunk = 0;
uint32_t img_size = 0;

// Keys for AppMessage Dictionary
// These should correspond to the values you defined in appinfo.json/Settings
enum {
	STATUS_KEY = 0,	
	MESSAGE_KEY = 1,
  IMG_KEY0 = 2,
  IMG_KEY1 = 3,
  IMG_KEY2 = 4,
  IMG_KEY3 = 5
};

// Write message to buffer & send
static void send_message(char *msg){
	DictionaryIterator *iter;
	
	app_message_outbox_begin(&iter);
	dict_write_cstring(iter, MESSAGE_KEY, msg);
	
	dict_write_end(iter);
  app_message_outbox_send();
}

void handle_img_tuple(Tuple *tuple, uint8_t index, uint32_t size) {
  if(tuple) {
    img = tuple -> value -> data;
    img_chunk = index;
    img_size = size;
    layer_mark_dirty(window_get_root_layer(window));
    
    switch(index){
      case 0:
      send_message("load1");
      break;
      case 1:
      send_message("load2");
      break;
      case 2:
      send_message("load3");
      break;
      case 3:
      send_message("loadDone");
      break;
      default:
      break;
    }
  }
}

// Called when a message is received from PebbleKitJS
static void in_received_handler(DictionaryIterator *received, void *context) {
	Tuple *tuple;
	
	tuple = dict_find(received, STATUS_KEY);
	if(tuple) {
		APP_LOG(APP_LOG_LEVEL_DEBUG, "Received Status: %d", (int)tuple->value->uint32); 
     send_message("got status");
	}
	
	tuple = dict_find(received, MESSAGE_KEY);
	if(tuple) {
		APP_LOG(APP_LOG_LEVEL_DEBUG, "Received Message: %s", tuple->value->cstring);
     send_message("got message");
	}
  
  handle_img_tuple(dict_find(received, IMG_KEY0), 0, 7200);
  handle_img_tuple(dict_find(received, IMG_KEY1), 1, 7200);
  handle_img_tuple(dict_find(received, IMG_KEY2), 2, 7200);
  handle_img_tuple(dict_find(received, IMG_KEY3), 3, 2592);
}

// Called when an incoming message from PebbleKitJS is dropped
static void in_dropped_handler(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Dropped Message, Reason: %d", reason);
}
// Called when PebbleKitJS does not acknowledge receipt of a message
static void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {}

static void layer_update_proc(Layer *layer, GContext *ctx) {
  GBitmap *fb = graphics_capture_frame_buffer(ctx);
  
  uint8_t *info = gbitmap_get_data(fb);
  memcpy(&info[7200*img_chunk], &img[0], img_size);
  
  graphics_release_frame_buffer(ctx, fb);
}

static void init(void) {
	window = window_create();
  layer_set_update_proc(window_get_root_layer(window), layer_update_proc);
	window_stack_push(window, true);
  //light_enable(true);
	
	// Register AppMessage handlers
	app_message_register_inbox_received(in_received_handler); 
	app_message_register_inbox_dropped(in_dropped_handler); 
	app_message_register_outbox_failed(out_failed_handler);

  // Initialize AppMessage inbox and outbox buffers with a suitable size
  const int inbox_size = 8200;
  const int outbox_size = 128;
	app_message_open(inbox_size, outbox_size);
}

static void deinit(void) {
	app_message_deregister_callbacks();
	window_destroy(window);
  //light_enable(false);
}

int main( void ) {
	init();
	app_event_loop();
	deinit();
}