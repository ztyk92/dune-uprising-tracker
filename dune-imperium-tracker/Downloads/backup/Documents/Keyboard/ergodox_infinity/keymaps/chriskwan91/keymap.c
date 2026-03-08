#include QMK_KEYBOARD_H
#include "debug.h"
#include "action_layer.h"
#include "version.h"

enum base {
  _BASE,
  _MAC,
  _SYMB,
  _MDIA
};

enum custom_keycodes {
  PLACEHOLDER = SAFE_RANGE, // can always be here
  // RGB_SLD,
};

enum {
  TD_ESC_CAPS = 0,
  TD_RBRKT,
  TD_LBRKT,
  TD_QUOTE,
  TD_MINUS,
  TD_PLUS,
  TD_COLON,
};

qk_tap_dance_action_t tap_dance_actions[] = {
  //Tap once for Esc, twice for Caps Lock
  [TD_ESC_CAPS] = ACTION_TAP_DANCE_DOUBLE(KC_ESCAPE, KC_CAPSLOCK),
  [TD_COLON] = ACTION_TAP_DANCE_DOUBLE(KC_SCOLON, KC_COLN),
  [TD_RBRKT] = ACTION_TAP_DANCE_DOUBLE(KC_RBRACKET, KC_RCBR),
  [TD_LBRKT] = ACTION_TAP_DANCE_DOUBLE(KC_LBRACKET, KC_LCBR),
  [TD_QUOTE] = ACTION_TAP_DANCE_DOUBLE(KC_QUOTE, KC_DQUO),
  [TD_MINUS] = ACTION_TAP_DANCE_DOUBLE(KC_MINUS, KC_UNDS),
  [TD_PLUS] = ACTION_TAP_DANCE_DOUBLE(KC_EQUAL, KC_PLUS),
// Other declarations would go here, separated by commas, if you have them
};


const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
/* Keymap 0: Basic layer */

[_BASE] = LAYOUT_ergodox(  // layer 0 : default
        // left hand
        KC_GRV,           KC_1,             KC_2,         KC_3,     KC_4,     KC_5,   KC_6,
        KC_TAB,           KC_Q,             KC_W,         KC_E,     KC_R,     KC_T,   TO(_SYMB),
        TD(TD_ESC_CAPS),  KC_A,             KC_S,         KC_D,     KC_F,     KC_G,
        KC_LSPO,          KC_Z,             KC_X,         KC_C,     KC_V,     KC_B,   TD(TD_LBRKT),
        TO(_MAC),         LCTL(LALT(KC_P)), ALL_T(KC_NO), KC_LCTRL, KC_LGUI,
                                                                    KC_PGUP,  KC_PGDOWN,
                                                                                        LALT(KC_PGUP),
                                                                    KC_LALT,  KC_DEL,   LALT(KC_PGDOWN),
        // right hand
        KC_PSCREEN,       KC_7,             KC_8,         KC_9,     KC_0,     KC_MINS,      KC_BSPACE,
        TO(_MDIA),        KC_Y,             KC_U,         KC_I,     KC_O,     KC_P,         KC_BSLASH,
                          KC_H,             KC_J,         KC_K,     KC_L,     TD(TD_COLON), TD(TD_QUOTE),
        TD(TD_RBRKT),     KC_N,             KC_M,         KC_COMMA, KC_DOT,   KC_SLASH,     KC_RSPC,
                          KC_EQL,           KC_LEFT,      KC_UP,    KC_DOWN,  KC_RIGHT,
        KC_HOME,          KC_END,
        KC_F3,
        KC_F7,        KC_ENT,  KC_SPACE
    ),

[_MAC] = LAYOUT_ergodox(  // layer 0 : default
        // left hand
        KC_GRV,           KC_1,             KC_2,         KC_3,     KC_4,     KC_5,     KC_6,
        KC_TAB,           KC_Q,             KC_W,         KC_E,     KC_R,     KC_T,     TT(_SYMB),
        TD(TD_ESC_CAPS),  KC_A,             KC_S,         KC_D,     KC_F,     KC_G,
        KC_LSPO,          KC_Z,             KC_X,         KC_C,     KC_V,     KC_B,     TD(TD_LBRKT),
        TO(_BASE),        LGUI(LALT(KC_P)), KC_TRNS,      KC_LCTRL, KC_LALT,
                                                                    KC_TRNS,  KC_TRNS,
                                                                                        LCTL(KC_PGUP),
                                                                    KC_LGUI,  KC_DEL,   LCTL(KC_PGDOWN),
        // right hand
        KC_NO,            KC_7,             KC_8,         KC_9,     KC_0,     KC_MINS,      KC_BSPACE,
        TT(_MDIA),        KC_Y,             KC_U,         KC_I,     KC_O,     KC_P,         KC_BSLASH,
                          KC_H,             KC_J,         KC_K,     KC_L,     TD(TD_COLON), TD(TD_QUOTE),
        TD(TD_RBRKT),     KC_N,             KC_M,         KC_COMMA, KC_DOT,   KC_SLASH,     KC_RSPC,
                          KC_EQL,           KC_LEFT,      KC_UP,    KC_DOWN,  KC_RIGHT,
        KC_HOME,          KC_END,
        KC_NO,
        KC_NO,            KC_ENT,  KC_SPACE
    ),

// SYMBOLS
[_SYMB] = LAYOUT_ergodox(
       // left hand
       KC_TRNS,    KC_F1,   KC_F2,   KC_F3,    KC_F4,     KC_F5,    KC_F6,
       KC_TRNS,    KC_NO,   KC_NO,   KC_UP,    KC_NO,     KC_NO,    TG(_SYMB),
       KC_TRNS,    KC_NO,   KC_LEFT, KC_DOWN,  KC_RIGHT,  KC_NO,
       KC_TRNS,    KC_NO,   KC_NO,   KC_NO,    KC_NO,     KC_NO,    KC_NO,
       KC_TRNS,    KC_TRNS, KC_TRNS, KC_TRNS,  KC_TRNS,
                                                          KC_TRNS,  KC_TRNS,
                                                                    KC_TRNS,
                                                          KC_TRNS,  KC_TRNS,
                                                          KC_TRNS,
       // right hand
       KC_F7,   KC_F8,   KC_F9,   KC_F10,  KC_F11,   KC_F12,  KC_TRNS,
       KC_TRNS, KC_NO,   KC_NO,   KC_UP,   KC_NO,    KC_NO,   KC_NO,
                KC_NO,   KC_LEFT, KC_DOWN, KC_RIGHT, KC_NO,   KC_NO,
       KC_TRNS, KC_NO,   KC_NO,   KC_NO,   KC_NO,    KC_NO,   KC_TRNS,
                         KC_TRNS, KC_TRNS, KC_TRNS,  KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS,
       KC_NO,
       KC_NO,   KC_TRNS, KC_TRNS
),

// MEDIA AND MOUSE
[_MDIA] = LAYOUT_ergodox(
       KC_TRNS,    KC_NO,   KC_NO,   KC_NO,    KC_NO,     KC_NO,    KC_NO,
       KC_TRNS,    KC_NO,   KC_NO,   KC_WH_U,  KC_NO,     KC_NO,    TO(_SYMB),
       KC_TRNS,    KC_NO,   KC_WH_L, KC_WH_D,  KC_WH_R,   KC_NO,
       KC_TRNS,    KC_NO,   KC_NO,   KC_NO,    KC_NO,     KC_NO,    KC_NO,
       KC_TRNS,    KC_TRNS, KC_TRNS, KC_TRNS,  KC_TRNS,
                                                          KC_TRNS,  KC_TRNS,
                                                                    KC_TRNS,
                                                          KC_TRNS,  KC_TRNS,
                                                          KC_TRNS,
       // right hand
       KC_NO,     KC_NO,   KC_NO,   KC_NO,   KC_NO,    KC_NO,   KC_TRNS,
       TG(_MDIA), KC_NO,   KC_NO,   KC_MS_U, KC_NO,    KC_NO,   KC_NO,
                  KC_NO,   KC_MS_L, KC_MS_D, KC_MS_R,  KC_NO,   KC_NO,
       KC_TRNS,   KC_NO,   KC_NO,   KC_NO,   KC_NO,    KC_NO,   KC_TRNS,
                           KC_TRNS, KC_TRNS, KC_TRNS,  KC_TRNS, KC_TRNS,
       KC_TRNS, KC_TRNS,
       KC_NO,
       KC_MS_BTN3,   KC_MS_BTN2, KC_MS_BTN1
)
// If it accepts an argument (i.e, is a function), it doesn't need KC_.
// Otherwise, it needs KC_*
};

const uint16_t PROGMEM fn_actions[] = {
    [1] = ACTION_LAYER_TAP_TOGGLE(_SYMB)                // FN1 - Momentary Layer 1 (Symbols)
};

const macro_t *action_get_macro(keyrecord_t *record, uint8_t id, uint8_t opt)
{
  // MACRODOWN only works in this function
      switch(id) {
        case 0:
        if (record->event.pressed) {
          SEND_STRING (QMK_KEYBOARD "/" QMK_KEYMAP " @ " QMK_VERSION);
        }
        break;
        case 1:
        if (record->event.pressed) { // For resetting EEPROM
          eeconfig_init();
        }
        break;
      }
    return MACRO_NONE;
};

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
  // switch (keycode) {
    // case RGB_SLD:
    //   if (record->event.pressed) {
    //     #ifdef RGBLIGHT_ENABLE
    //       rgblight_mode(1);
    //     #endif
    //   }
    //   return false;
    //   break;
  // }
  return true;
}

// Runs just one time when the keyboard initializes.
void matrix_init_user(void) {

};


// Runs constantly in the background, in a loop.
void matrix_scan_user(void) {

    uint8_t layer = biton32(layer_state);

    ergodox_board_led_off();
    ergodox_right_led_1_off();
    ergodox_right_led_2_off();
    ergodox_right_led_3_off();
    switch (layer) {
      // TODO: Make this relevant to the ErgoDox EZ.
        case 1:
            ergodox_right_led_1_on();
            break;
        case 2:
            ergodox_right_led_2_on();
            break;
        case 3:
            ergodox_right_led_3_on();
            break;
        default:
            // none
            break;
    }

};
