#!/usr/bin/env node
'use strict'
const fs = require('fs')
var parseString = require('xml2js').parseString

const file_name = `/Users/tnorlund/CloudFrontAnalytics-01.svg`
const style_re = /([\.a-z\-0-9,]+)\{([a-z0-9\.;:\-\(\)#]+)\}/gm
const style_exp = new RegExp( style_re )

let react_components = []
let react_index

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

const parsePaths = ( classes, g, react_components ) => {
  /**
   * Iterate over the different groups
   */
  g.forEach( group => {
    /**
     * Append this group to the end of the react components
     */
    react_components.push(
      { 
        ...classes[ group[`$`].class.split(`-`)[1] ],
        path: [],
        circle: [],
        g: []
      }
    )
    
    /**
     * Add all the paths to this group
     */
    if ( group.path ) {
      group.path.forEach( path => {
        react_components[ react_components.length - 1 ].path.push(
          {
            ...classes[ path[`$`].class.split(`-`)[1] ],
            d: path[`$`].d
          }
        )
      } )
    }

    /**
     * Add all the circles to this group
     */
     if ( group.circle ) {
      group.circle.forEach( circle => {
        react_components[ react_components.length - 1 ].circle.push(
          {
            ...classes[ circle[`$`].class.split(`-`)[1] ],
            cx: circle[`$`].cx, cy: circle[`$`].cy, r: circle[`$`].r,
          }
        )
      } )
    }

    /**
     * Recursively call this function when a group is in this group
     */
    if ( group.g ) {
      react_components[ react_components.length - 1 ].g = parsePaths(
        classes, 
        group.g,
        react_components[ react_components.length - 1 ].g
      )
    }
  } )
  return react_components
}

const indent = ( indent_number ) => `  `.repeat( indent_number )

const writeComponents = ( components, indent_number ) => {
  let comp = ``
  let component
  indent_number += 1
  components.forEach( group => {
    // console.log( {group} )
    comp += `<g `
    /**
     * Add the clip path if there is one for this group.
     */
    if ( `clip-path` in group )
      comp += `clipPath={\`${ group['clip-path'] }\`} >\n`
    if (group.circle.length > 0)
      comp += group.circle.map( circle => {
        component = indent( indent_number ) + `<circle `
        if ( circle.fill ) component += `fill={\`${ circle.fill }\`} `
        if ( circle.opacity ) component += `style={{opacity:${ circle.opacity }}} `
        component += `cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}" />`
        return component
      } ).join(`\n`) + `\n`
    if ( group.path.length > 0 )
      comp += group.path.map( path => {
        component = indent( indent_number ) + `<path `
        if ( path.fill ) component += `fill={\`${ path.fill }\`} `
        if ( path.opacity && path.isolation ) component += `style={{opacity:${path.opacity}, isolation:\`${path.isolation}\`}} `
        else if ( path[`fill-opacity`] ) component += `style={{opacity:${ path[`fill-opacity`] }}} `
        component += `d="${path.d}" />`
        return component
      } ).join(`\n`) + `\n`
    if ( group.g.length > 0 )
      comp += writeComponents( group.g, indent_number )
    comp += `</g>\n`
  } )
  return comp
}

fs.readFile( file_name, (err, data) => { 
  if (err) throw err; 
  parseString( data, ( error, result ) => {
    const indent_number = 0
    const { defs, g } = result.svg
    const classes = parseClasses( defs[0].style[0] )
    const parsed_components = parsePaths( classes, g, react_components )
    console.log( writeComponents( parsed_components, indent_number ) )
  } )
} )

console.log(`HERE!`)