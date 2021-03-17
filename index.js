#!/usr/bin/env node
'use strict'
const fs = require('fs')
var parseString = require('xml2js').parseString

const file_name = `/Users/tnorlund/API_APIGateway.svg`
const style_re = /([\.a-z\-0-9,]+)\{([A-Za-z0-9\.;:\-\(\)#]+)\}/gm
const style_exp = new RegExp( style_re )

const project = `API`

/** Returns a properly formatted gradient stop. */
const gradientStop = ( gradient ) => {
  return gradient.stop.map( stop => {
    if ( stop[`$`][`stop-opacity`] ) return `<stop offset="${ stop[`$`].offset }" stopColor="${ stop[`$`][`stop-color`] }" stopOpacity="${ stop[`$`][`stop-opacity`] }"/>`
    return `<stop offset="${ stop[`$`].offset }" stopColor="${ stop[`$`][`stop-color`] }" />`
  } ).join( `` )
}

/**
 * Parses the classes from the style element set by Illustrator.
 * @param {string} defs The style element set by Illustrator.
 * @returns The parsed style as an object.
 */
const parseClasses = ( defs ) => {
  /** Store the style in a separate variable so that it can be modified. */
  let style = defs[0].style[0]

  let count = {
    clippath: 1, lineargradient: 1, radialgradient: 1
  }
  let temp_linearGradients = {}
  let temp_radialGradients = {}
  const comps = defs[0].$$.map( def => {
    switch( def[ `#name` ] ) {
      case `radialGradient`: {
        if ( def.stop ) temp_radialGradients[ def.$.id ] = def.stop
        else {
          def.stop = temp_radialGradients[ def.$[`xlink:href`].split( `#` )[1] ]
          temp_radialGradients[ def.$.id ] = def.stop
        }
          if ( /radial-gradient-\d+/.test( def.$.id ) ) {
            count.radialgradient += 1
            style = style.replaceAll( `url(#${ def.$.id });`, `url(#${ project }-radial-gradient-${ count.radialgradient });` )
            /** Apply a gradient transform if present. */
            if ( def.$.gradientTransform  ) {
              return `${ indent( 1 ) }<radialGradient id="${ project }-radial-gradient-${ count.radialgradient }" cx="${ def.$.cx }" cy="${ def.$.cy }" r="${ def.$.r }" gradientTransform="${ def.$.gradientTransform }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</radialGradient>\n`
            }
            return `${ indent( 1 ) }<radialGradient id="${ project }-radial-gradient-${ count.radialgradient }" cx="${ def.$.cx }" cy="${ def.$.cy }" r="${ def.$.r }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</radialGradient>\n`
          } else {
            style = style.replaceAll( `url(#${ def.$.id });`, `url(#${ project }-radial-gradient-1);` )
            if ( def.$.gradientTransform  )
              return `${ indent( 1 ) }<radialGradient id="${ project }-radial-gradient-1" cx="${ def.$.cx }" cy="${ def.$.cy }" r="${ def.$.r }" gradientTransform="${ def.$.gradientTransform }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</radialGradient>\n`
            return `${ indent( 1 ) }<radialGradient id="${ project }-radial-gradient-1" cx="${ def.$.cx }" cy="${ def.$.cy }" r="${ def.$.r }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</radialGradient>\n`
          }
        break
      }
      case `linearGradient`: {
        if ( def.stop ) temp_linearGradients[ def.$.id ] = def.stop
        else {
          def.stop = temp_linearGradients[ 
            def.$[`xlink:href`].split( `#` )[1] 
          ]
          temp_linearGradients[ def.$.id ] = def.stop
        }
        if ( /linear-gradient-\d+/.test( def.$.id ) ) {
          count.lineargradient += 1
          style = style.replaceAll( `url(#${ def.$.id });`, `url(#${ project }-linear-gradient-${ count.lineargradient });` )
          /** Apply a gradient transform if present. */
          if ( def.$.gradientTransform  ) {
            return `${ indent( 1 ) }<linearGradient id="${ project }-linear-gradient-${ count.lineargradient }" x1="${ def.$.x1 }" y1="${ def.$.y1 }" x2="${ def.$.x2 }" y2="${ def.$.y2 }" gradientTransform="${ def.$.gradientTransform }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</linearGradient>\n`
          }
          return `${ indent( 1 ) }<linearGradient id="${ project }-linear-gradient-${ count.lineargradient }" x1="${ def.$.x1 }" y1="${ def.$.y1 }" x2="${ def.$.x2 }" y2="${ def.$.y2 }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</linearGradient>\n`
        } else {
          style = style.replaceAll( `url(#${ def.$.id });`, `url(#${ project }-linear-gradient-1);` )
          if ( def.$.gradientTransform  )
            return `${ indent( 1 ) }<linearGradient id="${ project }-linear-gradient-1" x1="${ def.$.x1 }" y1="${ def.$.y1 }" x2="${ def.$.x2 }" y2="${ def.$.y2 }" gradientTransform="${ def.$.gradientTransform }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</linearGradient>\n`
          return `${ indent( 1 ) }<linearGradient id="${ project }-linear-gradient-1" x1="${ def.$.x1 }" y1="${ def.$.y1 }" x2="${ def.$.x2 }" y2="${ def.$.y2 }" gradientUnits="userSpaceOnUse">${ gradientStop( def ) }</linearGradient>\n`
        }
        break
      }
      case `clipPath`: {
        if ( def.polygon ) {
          if ( /clip-path-\d+/.test( def.$.id ) ) {
            count.clippath += 1
            style = style.replaceAll( `clip-path:url(#${ def.$.id });`, `clip-path:url(#${ project }-clip-path-${ count.clippath });` )
            return `${ indent( 1 ) }<clipPath id="${ project }-clip-path-${ count.clippath }"><polygon points="${ def.polygon[0].$.points }" /></clipPath>\n`
          } else {
            style = style.replaceAll( `clip-path:url(#${def.$.id});`, `clip-path:url(#${ project }-clip-path-1);` )
            return `${ indent( 1 ) }<clipPath id="${ project }-clip-path-1"><polygon points="${ def.polygon[0].$.points }" /></clipPath>\n`
          }
        }
        if ( def.circle ) {
          if ( /clip-path-\d+/.test( def.$.id ) ) {
            count.clippath += 1
            style = style.replaceAll( `clip-path:url(#${ def.$.id });`, `clip-path:url(#${ project }-clip-path-${ count.clippath });` )
            return `${ indent( 1 ) }<clipPath id="${ project }-clip-path-${ count.clippath }"><circle cx="${ def.circle[0].$.cx }" cy="${ def.circle[0].$.cy }" r="${ def.circle[0].$.r }" /></clipPath>\n`
          } else {
            style = style.replaceAll( `clip-path:url(#${ def.$.id });`, `clip-path:url(#${ project }-clip-path-1);` )
            return `${ indent( 1 ) }<clipPath id="${ project }-clip-path-1"><circle cx="${ def.circle[0].$.cx }" cy="${ def.circle[0].$.cy }" r="${ def.circle[0].$.r }" /></clipPath>\n`
          }
        }
        else throw new Error( `Could not parse clipPath ${ def }`)
        break
      }
      case `style`: { return ``; break; }
      default:
        throw new Error( `Could  not parse def type ${ def[ `#name` ] }` )
    }
  } ).join( `` )

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
  return { 
    classes, 
    output_def: `<defs>\n${ comps }</defs>\n` 
  }
}

/**
 * Adds
 * @param {Object} style The parsed class's style
 * @returns The React-link implementation of the component's style
 */
const applyStyle = ( style ) => {
  if ( typeof style == `undefined` ) return ``
  let return_style = ``
  if ( style.fill ) return_style += `fill={\`${ style.fill }\`} `
  if ( style.stroke ) return_style += `stroke={\`${ style.stroke }\`} `
  if ( style[`stroke-linejoin`] ) return_style += `strokeLinejoin={\`${ style[`stroke-linejoin`] }\`} `
  if ( style[`stroke-width`] ) return_style += `strokeWidth={\`${ style[`stroke-width`] }\`} `
  if ( style.opacity && style.isolation ) return_style += `style={{opacity:${style.opacity}, isolation:\`${style.isolation}\`}} `
  else if ( style[`fill-opacity`] ) return_style += `style={{opacity:${ style[`fill-opacity`] }}} `
  if ( style[`clip-path`] ) return_style += `clipPath={\`${ style[`clip-path`] }\`} `
  if ( style.opacity ) return_style += `style={{opacity:${ style.opacity }}} `
  return return_style
}

const parsePaths = ( classes, g, indent_number, output ) => {
  let style
  /**
   * Iterate over the different groups
   */
  g.forEach( group => {
    output += indent( indent_number ) + `<g `
    if ( group[`$`].id ) output += `id="${ group[`$`].id }" `
    if ( group.$.class ) style = classes[ group.$.class.split(`-`)[1] ]
    else style = undefined
    output += `${ applyStyle( style ) } >\n`
    indent_number += 1
    /**
     * Iterate over the child nodes inside of the group.
     */
    group[`$$`].forEach( node => {
      let component
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
          if ( node[`$`].y ) component += `y="${ node[`$`].y }" `
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
          throw new Error( `Cannot parse type, ${ node[`#name`] }`)
      }
      output += component
    } )
    indent_number -= 1
    output +=  indent( indent_number ) + `</g>\n`
  } )
  return output
}

/** Gives a certain number of spaces based on the number given. */
const indent = ( indent_number ) => `  `.repeat( indent_number )

fs.readFile( file_name, (err, data) => { 
  if (err) throw err; 
  parseString( data, { explicitChildren: true, preserveChildrenOrder: true }, ( error, result ) => {
    const indent_number = 0
    let output = ``
    const { defs, g } = result.svg
    const { classes, output_def } = parseClasses( defs )
    const parsed_output = parsePaths( classes, g, indent_number, output )
    console.log(
       `<svg viewBox="${result.svg.$.viewBox}">\n${
        output_def + parsed_output 
      }</svg>`
    )
  } )
} )