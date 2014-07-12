var Color = require('../../src/utilities/color.js');
var colorlist = require('../data/colors.js');
var assert = require("assert");

suite('Color', function(){
    var red, green, rgba, hsl, hsla, aliceblue, epsilon;
    setup(function(){
        red = new Color("red");
        green = new Color("#BADA55");
        rgba = new Color("rgba(255, 0, 0, 0.3)");
        epsilon = 0.01;
        hsl = new Color("hsl(0, 100%, 50%)");
        hsla = new Color("hsla(0, 100%, 50%, 0.3)");
    });
    suite('properties', function(){
        test('rgb', function(){
            assert.equal(red.rgb.r, 255);
            assert.equal(red.rgb.g, 0);
            assert.equal(red.rgb.b, 0);
        });
        test('hsl', function(){
            assert.equal(red.hsl.h, 0);
            assert.equal(red.hsl.s, 1);
            assert.equal(red.hsl.l, 0.5);
        });
        test('alpha', function(){
            assert.ok(Math.abs(red.alpha - 1) < epsilon);
            assert.ok(Math.abs(rgba.alpha - 0.3) < epsilon);
        });
    });
    suite('methods', function(){
        test('lighten', function(){

        });
        test('darken', function(){

        });
        test('hslToRgb', function(){

        });
        test('rgbToHsl', function(){

        });
    });
});