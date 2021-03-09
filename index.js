#!/usr/bin/env node
'use strict'
const fs = require('fs')
var parseString = require('xml2js').parseString

const file_name = `/Users/tnorlund/API_APIGateway.svg`
const style_re = /([\.a-z\-0-9,]+)\{([a-z0-9\.;:\-\(\)#]+)\}/gm
const style_exp = new RegExp( style_re )

/**
 * Parses the classes from the style element set by Illustrator.
 * @param {string} style The style element set by Illustrator.
 * @returns The parsed style as an object.
 */
const parseClasses = ( style ) => {
  let match
  let classes = {}
  let class_number
  let class_options
  let class_type 
  /**
   * Iterate over the different classes assigned by Illustrator.
   */
  while( null != ( match = style_exp.exec( style ) ) ) {
    match[1].split(`,`).forEach( element => {
      class_number = parseInt( element.split(`-`)[1] )
      /**
       * Iterate over the different css attributes per class
       */
      match[2].split(`;`).forEach( elm => {
        if ( elm.split(`:`).length > 1 ) {
          [ class_type, class_options ] = elm.split( `:` )
          if ( classes[ parseInt( class_number ) ] ) {
            classes[ parseInt( class_number ) ][ class_type ] = class_options
          } else {
            classes[ parseInt( class_number ) ] = {}
            classes[ parseInt( class_number ) ][ class_type ] = class_options
          }
        }
      } )
    } )
  } 
  return classes
}

/**
 * Adds
 * @param {Object} style The parsed class's style
 * @returns The React-link implementation of the component's style
 */
const applyStyle = ( style ) => {
  if ( typeof style == undefined ) return ``
  let return_style = ``
  if ( style.fill ) return_style += `fill={\`${ style.fill }\`} `
  if ( style.stroke ) return_style += `stroke={\`${ style.stroke }\`} `
  if ( style[`stroke-linejoin`] ) return_style += `strokeLinejoin={\`${ style[`stroke-linejoin`] }\`} `
  if ( style[`stroke-width`] ) return_style += `strokeWidth={\`${ style[`stroke-width`] }\`} `
  if ( style.opacity && style.isolation ) return_style += `style={{opacity:${style.opacity}, isolation:\`${style.isolation}\`}} `
  else if ( style[`fill-opacity`] ) return_style += `style={{opacity:${ style[`fill-opacity`] }}} `
  return return_style
}

const parsePaths = ( classes, g, indent_number, output ) => {
  /**
   * Iterate over the different groups
   */
  g.forEach( group => {
    output += indent( indent_number ) + `<g `
    if ( group[`$`].id ) output += `id="${ group[`$`].id }" `
    output += `/>\n`
    indent_number += 1
    /**
     * Iterate over the child nodes inside of the group.
     */
    group[`$$`].forEach( node => {
      let component
      let style
      /** 
       * Attempt to apply the component's style. Set it to undefined if there 
       * is none. 
       */
      if ( node[`$`].class ) style = classes[ node[`$`].class.split(`-`)[1] ]
      else undefined

      switch( node[`#name`] ) {
        case `line`:
          component =  indent( indent_number ) + `<line ${ applyStyle( style ) }x1="${ node[`$`].x1 }" y1="${ node[`$`].y1 }" x2="${ node[`$`].x2 }" y2="${ node[`$`].y2 }" />\n`
          break
        case `polygon`:
          component =  indent( indent_number ) + `<polygon ${ applyStyle( style ) }points="${ node[`$`].points }" />\n`
          break
        case `rect`:
          /** <rect /> components don't need all values. */
          component =  indent( indent_number ) + `<rect ${ applyStyle( style ) }`
          if ( node[`$`].x ) component += `x="${ node[`$`].x }" `
          if ( node[`$`].y ) component += `x="${ node[`$`].y }" `
          if ( node[`$`].width ) component += `width="${ node[`$`].width }" `
          if ( node[`$`].height ) component += `height="${ node[`$`].height }" `
          component += `/>\n`
          break
        case `path`:
          component =  indent( indent_number ) + `<path ${ applyStyle( style ) }d="${ node[`$`].d }" />\n`
          break
        case `circle`:
          component =  indent( indent_number ) + `<circle ${ applyStyle( style ) }cx="${ node[`$`].cx }" cy="${ node[`$`].cy }" r="${ node[`$`].r }" />\n`
          break
        case `ellipse`:
          component =  indent( indent_number ) + `<ellipse ${ applyStyle( style ) }cx="${ node[`$`].cx }" cy="${ node[`$`].cy }" rx="${ node[`$`].rx }" ry="${ node[`$`].ry }" />\n`
          break
        case `polyline`:
          component =  indent( indent_number ) + `<polyline ${ applyStyle( style ) }points="${ node[`$`].points }" />\n`
          break
        case `g`:
          component = parsePaths( classes, [ node ], indent_number, `` )
          break
        default: 
          console.log( `don't know how to process`, node[`#name`] )
      }
      output += component
    } )
    indent_number -= 1
    output +=  indent( indent_number ) + `</g>\n`
  } )
  return output
}

const indent = ( indent_number ) => `  `.repeat( indent_number )

fs.readFile( file_name, (err, data) => { 
  if (err) throw err; 
  parseString( data, { explicitChildren: true, preserveChildrenOrder: true }, ( error, result ) => {
    const indent_number = 0
    let output = ``
    const { defs, g } = result.svg
    console.log( defs[0][`$$`] )
    const classes = parseClasses( defs[0].style[0] )
    const parsed_output = parsePaths( classes, g, indent_number, output )
    // console.log( parsed_output )
  } )
} )

console.log(`HERE!`)