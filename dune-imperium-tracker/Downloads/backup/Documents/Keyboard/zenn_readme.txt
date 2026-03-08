ctrl backspace tab c v a t w n b i u pgdn pgup home end up down left right
alt f4 ctrl f5
windows d e up down left right
shift tab
ctrl pgup ctrl pgdn
f1 f2 
delete 
` for map



in game:
f keys










shortcuts
C:\Users\tanyo\qmk_firmware\keyboards\lily58\keymaps\ztyk92
C:\Users\tanyo\qmk_firmware\keyboards\redox\keymaps\ztyk92
C:\Users\tanyo\qmk_firmware\keyboards\ergodox_infinity\keymaps\ztyk92
C:\Users\tanyo\qmk_firmware\keyboards\absolem\keymaps







FOR VIA:

make sure keyboard is flashed with a firmware that is compatible with VIA in the first place

it will be auto detected when plugged in

if not detected, ctrl o the keymap json




FOR FLASHING:

installation procedure
	1. install qmk msys for building firmware and json2c
		find default qmk folder in C:\Users\tanyo\qmk_firmware
	2. install qmk toolbox for flashing
	
generate keymap JSON using https://config.qmk.fm/#/ergodox_infinity/LAYOUT_ergodox

download json

cd to json
	cd qmk_firmware/keyboards/ergodox_infinity/keymaps/ztyk92/
	cd qmk_firmware/keyboards/lily58/keymaps/ztyk92/

convert json to c
	qmk json2c zennergodox.json

copy paste keymap to keymap.c

open qmk msys cli

qmk compile -kb ergodox_infinity -km ztyk92
	left keyboard is master

open qmk toolbox

connect left keyboard

press reset button 

select the bin firmware file \qmk_firmware\.build\ergodox_infinity_ztyk92.bin

click flash






//
C:\msys32\home\User\qmk_firmware

Open mingw 64 bit

generate keymap JSON using https://config.qmk.fm/#/ergodox_infinity/LAYOUT_ergodox

cd qmk_firmware/keyboards/ergodox_infinity/keymaps/ztyk92/
cd qmk_firmware/keyboards/lily58/keymaps/ztyk92/

qmk json2c zennergodox200920.json
qmk json2c zenn_lily58.json


qmk compile -kb ergodox_infinity -km ztyk92
qmk compile -kb ergodox_infinity -km chriskwan91

qmk compile -kb lily58 -km ztyk92


For the linux shell, the folder matters. You should be in the qmk_firmware folder. And from there, you want to run

Make sure you are in the top-level qmk_firmware directory

Build the firmware with  make ergodox_infinity:ztyk92
make lily58:ztyk92
//








if error
dfu-programmer.exe atmega32u4 erase --force
dfu-programmer: no device present.
dfu-programmer.exe atmega32u4 flash "C:\Users\geno\OneDrive\Keyboard\firmware\tu60rgb_geno.hex"
dfu-programmer: no device present.
dfu-programmer.exe atmega32u4 reset
dfu-programmer: no device present.


https://docs.qmk.fm/#/driver_installation_zadig
then use zadig utility, list all devices and select ATm32U4DFU (which is the lily58)
Installing the libusb-win32 driver with zadig resolved the issue. 






ergodox_infinity

Plug in the left hand keyboard only.

Press the program button (back of keyboard, above thumb pad).

Install the firmware with sudo make ergodox_infinity:ztyk92:dfu-util

Build right hand firmware with make ergodox_infinity:ztyk92 MASTER=right

Plug in the right hand keyboard only.

Press the program button (back of keyboard, above thumb pad).

Install the firmware with sudo make ergodox_infinity:ztyk92:dfu-util MASTER=right