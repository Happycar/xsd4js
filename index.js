module.exports = function () {
    const begin = Date.now();

//////////////////////////////////////////////////////////////////////////////////////////////////

    const fs = require("fs-extra");
    const parseString = require('xml2js').parseString;

//////////////////////////////////////////////////////////////////////////////////////////////////

    let filesGenerated = 0;
    let enumsGenerated = 0;
    let errorCount = 0;

//////////////////////////////////////////////////////////////////////////////////////////////////

    let SOURCE_BIN = addLastSlash(process.argv[2]);
    let BIN = SOURCE_BIN;
    let SOURCE_SOURCE_PATH = null;

    try {
        fs.removeSync(SOURCE_BIN);
    } catch (e) {
        // if not able to remove keep going...
    }

    let sourcePath = process.argv[3];

    if (fs.lstatSync(sourcePath).isFile()) {
        extractFromFile(sourcePath);
    } else {
        SOURCE_SOURCE_PATH = sourcePath;

        extractFromDirectory(sourcePath);
    }

    console.log(`
============================================================

\tCreated files:\t${filesGenerated}
\tENUMs:\t\t${enumsGenerated} (${Math.round(enumsGenerated / filesGenerated * 100)}%)

\tErrors:\t\t${errorCount}

\tTime:\t\t${Date.now() - begin} ms

============================================================
`);
}

//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

function addLastSlash(path) {
    if (isXSDFilePath(path)) {
        return path;
    }

    if (path && path.lastIndexOf(`/`) != path.length - 1) {
        return path + `/`;
    } else {
        return path;
    }
}

function extractFromFile(sourcePath) {
    console.log(`📄  Extracting ES6 classes from ${sourcePath}...`);

    const filePath = fs.readFileSync(sourcePath).toString();

    parseString(filePath, {
        trim: true,
        emptyTag: null,
        explicitArray: false
    }, (err, obj) => {
        parseStringFile(err, obj, sourcePath);
    });
}

function isXSDFilePath(filename) {
    const filenameParts = filename.split(`.`);

    return filenameParts[filenameParts.length - 1] === `xsd`;
}

function extractFromDirectory(sourcePath) {
    sourcePath = addLastSlash(sourcePath);

    let directoryFiles = fs.readdirSync(sourcePath);

    if (directoryFiles && directoryFiles.length > 0) {
        const hasXSDFiles = directoryFiles.some((filename) => {
            return isXSDFilePath(filename);
        });

        if (hasXSDFiles) {
            console.log(`📂  Extracting ES6 classes from XSD files in ${sourcePath}...`);
        }

        const sourcePathDiff = sourcePath.substring(addLastSlash(SOURCE_SOURCE_PATH).length);

        directoryFiles.forEach((filename) => {
            BIN = SOURCE_BIN
                + sourcePathDiff
                + filename.substring(0, filename.indexOf(`.xsd`))
                + `/`;
            const finalSourcePath = sourcePath + filename;

            if (!fs.lstatSync(finalSourcePath).isFile()) {
                extractFromDirectory(finalSourcePath);
            } else if (isXSDFilePath(finalSourcePath)) {
                extractFromFile(finalSourcePath);
            }
        });
    }
}

function createFile(fileName, content) {
    fileName = `${BIN}${fileName}`;

    fs.outputFileSync(fileName, content, {
        encoding: 'utf8',
        flag: 'wx'
    });

    console.log(`\t${fileName} file created...`);

    filesGenerated++;
}

function debug(value) {
    console.log(`##################################################`);
    console.log(`##################################################`);
    console.log(`##################################################`);
    console.log(`##################################################`);
    console.log(JSON.stringify(value, null, 4));
    console.log(`##################################################`);
    console.log(`##################################################`);
    console.log(`##################################################`);
    console.log(`##################################################`);
}

function parseStringFile(errors, obj, filePath) {
    if (!obj) {
        console.log(`
-------------------
☠  Error: ${filePath}
${errors}
-------------------
        `);

        errorCount++;

        return;
    }

    const NAMESPACE_PREFIX = `${Object.keys(obj)[0].split(':')[0]}:`;
    const SCOPE = '$';

    const TYPE_PROPERTY = 'type';
    const REF_PROPERTY = 'ref';
    const BOOLEAN_TAG = 'boolean';
    const STRING_TAG = 'string';
    const BASE = 'base';

    const XS_ALL = `${NAMESPACE_PREFIX}all`;
    const XS_ATTRIBUTE = `${NAMESPACE_PREFIX}attribute`;
    const XS_ATTRIBUTE_GROUP = `${NAMESPACE_PREFIX}attributeGroup`;
    const XS_BASE = NAMESPACE_PREFIX + BASE;
    const XS_BYTE = `${NAMESPACE_PREFIX}byte`;
    const XS_COMPLEX_TYPE = `${NAMESPACE_PREFIX}complexType`;
    const XS_DECIMAL = `${NAMESPACE_PREFIX}decimal`;
    const XS_ELEMENT = `${NAMESPACE_PREFIX}element`;
    const XS_ENUMERATION = `${NAMESPACE_PREFIX}enumeration`;
    const XS_EXTENSION = `${NAMESPACE_PREFIX}extension`;
    const XS_FRACTION_DIGITS = `${NAMESPACE_PREFIX}fractionDigits`;
    const XS_MAX_EXCLUSIVE = `${NAMESPACE_PREFIX}maxExclusive`;
    const XS_MAX_LENGTH = `${NAMESPACE_PREFIX}maxLength`;
    const XS_MIN_INCLUSIVE = `${NAMESPACE_PREFIX}minInclusive`;
    const XS_NON_NEGATIVE_INTEGER = `${NAMESPACE_PREFIX}nonNegativeInteger`;
    const XS_PATTERN = `${NAMESPACE_PREFIX}pattern`;
    const XS_RESTRICTION = `${NAMESPACE_PREFIX}restriction`;
    const XS_SCHEMA = `${NAMESPACE_PREFIX}schema`;
    const XS_SEQUENCE = `${NAMESPACE_PREFIX}sequence`;
    const XS_SIMPLE_CONTENT = `${NAMESPACE_PREFIX}simpleContent`;
    const XS_SIMPLE_TYPE = `${NAMESPACE_PREFIX}simpleType`;
    const XS_TOTAL_DIGITS = `${NAMESPACE_PREFIX}totalDigits`;
    const XS_ANY = `${NAMESPACE_PREFIX}any`;
    const XS_UNION = `${NAMESPACE_PREFIX}union`;
    const XS_CHOICE = `${NAMESPACE_PREFIX}choice`;

    const basicTypes = {};
    const complexTypes = {};
    const parseFurtherQueue = [];
    const createdEnum = {};

    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    function getAsClassName(name) {
        try {
            return name[0].toUpperCase() + name.substring(1);
        } catch (e) {
            return name;
        }
    }

    function getComplexType(name) {
        return complexTypes[name];
    }

    function setComplexType(key, value) {
        complexTypes[key] = value;
    }

    function getName(value) {
        return value[SCOPE].name;
    }

    function getUse(value) {
        return value[SCOPE].use;
    }

    function getType(value) {
        return value[SCOPE].type;
    }

    function getBaseFromSimpleType(value) {
        try {
            return value[XS_SIMPLE_TYPE][XS_RESTRICTION][SCOPE].base;
        } catch (e) {
            return undefined;
        }
    }

    function getRef(value) {
        const rtn = value[SCOPE].ref;

        if (!rtn) {
            try {
                return value[XS_ATTRIBUTE_GROUP][SCOPE].ref;
            } catch (e) {
                return undefined;
            }
        }

        return rtn;
    }

    function getMinOccurs(value) {
        return value[SCOPE].minOccurs;
    }

    function getMaxOccurs(value) {
        return value[SCOPE].maxOccurs;
    }

    //////////////////////////////////////////////////////////////////////////////////////

    function removeNamespace(value) {
        if (!value) {
            return value;
        }

        const indexOfXS = value.indexOf(NAMESPACE_PREFIX);

        return indexOfXS >= 0 ? value.substring(indexOfXS + NAMESPACE_PREFIX.length) : value;
    }

    //////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////

    function getAttribute(value) {
        if (!!value && value instanceof Array) {
            return value;
        }

        // debug(value);

        if (value.hasOwnProperty(XS_CHOICE)) {
            try {
                return value[XS_CHOICE][XS_SEQUENCE][XS_ELEMENT];
            } catch (e) {
                return value[XS_CHOICE][XS_ELEMENT];
            }
        }

        if (value.hasOwnProperty(XS_SEQUENCE)) {
            return value[XS_SEQUENCE];
        }

        if (!!value) {
            if (value.hasOwnProperty(XS_COMPLEX_TYPE)) {
                try {
                    const attributeElements = value[XS_COMPLEX_TYPE][XS_SEQUENCE][XS_ELEMENT];

                    if (attributeElements instanceof Array) {
                        attributeGroupParser(value);
                    } else {
                        value = attributeElements;
                    }
                } catch (e) {
                    // do nothing...
                }
            }

            if (!(
                    value.hasOwnProperty(XS_ANY)
                )) {
                if (!value.hasOwnProperty(SCOPE) && value.hasOwnProperty(XS_EXTENSION)) {
                    value = value[XS_EXTENSION];
                }

                // debug(value);

                const name = getName(value);
                const use = getUse(value);
                const ref = getRef(value);
                const minOccurs = getMinOccurs(value);
                const maxOccurs = getMaxOccurs(value);

                let type = getType(value);

                if (!type && value.hasOwnProperty(XS_SIMPLE_TYPE)) {
                    type = getBaseFromSimpleType(value);
                }

                return {
                    name: removeNamespace(name),
                    use: removeNamespace(use),
                    type: removeNamespace(type),
                    ref: removeNamespace(ref),
                    minOccurs: minOccurs,
                    maxOccurs: maxOccurs
                };
            }
        }

        parseFurther(value);

        return undefined;
    }

    function getAttributes(value) {
        let attributes = value;

        if (!!attributes) {
            if (!(attributes instanceof Array)) {
                attributes = [attributes];
            }

            let rtn = [];

            for (let index in attributes) {
                const attribute = attributes[index];
                const parsedAttribute = getAttribute(attribute);

                if (parsedAttribute) {
                    if (parsedAttribute instanceof Array) {
                        rtn = rtn.concat(parsedAttribute);
                    } else {
                        rtn.push(parsedAttribute);
                    }
                }
            }

            return rtn.length > 0 ? rtn : undefined;
        }

        return undefined;
    }

    function getEnumeration(value) {
        if (!value) {
            return;
        }

        let enumValues = value[XS_ENUMERATION];

        if (!(enumValues instanceof Array)) {
            enumValues = [enumValues];
        }

        const rtn = enumValues
            .filter(function (value) {
                return !!value;
            })
            .map(function (value) {
                return value[SCOPE].value;
            });

        return rtn.length > 0 ? rtn : undefined;
    }

    function getScopeValue(value, property) {
        try {
            return value[property][SCOPE].value;
        } catch (e) {
            return;
        }
    }

    function populateScopeValues(base, source, properties) {
        for (let index in properties) {
            const property = properties[index];

            base[removeNamespace(property)] = removeNamespace(getScopeValue(source, property));
        }
    }

    function getRestrictions(value) {
        const rtn = { base: removeNamespace(value[SCOPE].base) };

        rtn.enumeration = getEnumeration(value);

        populateScopeValues(rtn, value, [
            XS_PATTERN,
            XS_MIN_INCLUSIVE,
            XS_MAX_EXCLUSIVE,
            XS_MAX_LENGTH,
            XS_FRACTION_DIGITS,
            XS_DECIMAL
        ]);

        return rtn;
    }

    function attributeGroupParser(value) {
        if (!!value && value.hasOwnProperty(SCOPE)) {
            const name = getName(value);
            let ref = getRef(value);

            if (!!name) {
                const attributes = value[XS_ATTRIBUTE];
                const restriction = value[XS_RESTRICTION];
                const simpleType = value[XS_SIMPLE_TYPE];
                const complexType = value[XS_COMPLEX_TYPE];
                const sequence = value[XS_SEQUENCE];
                const simpleContent = value[XS_SIMPLE_CONTENT];
                const attributeGroup = value[XS_ATTRIBUTE_GROUP];

                if (!!attributeGroup && attributeGroup.hasOwnProperty(SCOPE) && !ref) {
                    ref = attributeGroup[SCOPE][REF_PROPERTY];
                }

                if (!!restriction || !!simpleType) {
                    const restrictions = restriction || simpleType[XS_RESTRICTION];

                    if (!!restrictions) {
                        basicTypes[name] = getRestrictions(restrictions);
                    }
                } else if (!!attributes || !!complexType || !!sequence || !!simpleContent) {
                    if (!!attributes) {
                        setComplexType(name, getAttributes(attributes));

                        if (!!getComplexType(name) && getComplexType(name).length > 0 && !!ref) {
                            for (let index in getComplexType(name)) {
                                if (!getComplexType(name)[index].ref) {
                                    getComplexType(name)[index].ref = ref;
                                }
                            }
                        }
                    }

                    if (!!complexType || !!sequence || !!simpleContent) {
                        if (!getComplexType(name)) {
                            setComplexType(name, []);
                        }

                        let complexTypeProperties = [
                            simpleContent,
                            sequence
                        ];

                        if (!!complexType) {
                            complexTypeProperties = complexTypeProperties.concat([
                                complexType[XS_SEQUENCE],
                                complexType[XS_ALL],
                                complexType[XS_ATTRIBUTE],
                                complexType[XS_SIMPLE_CONTENT],
                                complexType[XS_CHOICE]
                            ]);
                        }

                        for (let complexTypeProperty of complexTypeProperties) {
                            if (!!complexTypeProperty) {
                                let attributes = complexTypeProperty[XS_ELEMENT];

                                if (complexTypeProperty.hasOwnProperty(XS_EXTENSION) && !!complexTypeProperty[XS_EXTENSION]) {
                                    attributes = complexTypeProperty[XS_EXTENSION][XS_ATTRIBUTE];
                                }

                                if (!attributes) {
                                    attributes = complexTypeProperty;
                                }

                                const retrieveAttributes = getAttributes(attributes);
                                let parsedAttributes = getComplexType(name).concat(retrieveAttributes);

                                if (!!complexTypeProperty[XS_EXTENSION]) {
                                    const type = complexTypeProperty[XS_EXTENSION][SCOPE].base;

                                    parsedAttributes = parsedAttributes.map(function (value) {
                                        value.type = removeNamespace(type);

                                        return value;
                                    });
                                }

                                // debug({
                                //     name: name + `<<<`,
                                //     parsedAttributes: parsedAttributes
                                // });

                                setComplexType(name, parsedAttributes);
                            }
                        }
                    }
                } else {
                    basicTypes[name] = {
                        base: removeNamespace(
                            value[SCOPE].type || ref
                        )
                    };
                }

                return;
            }
        }

        parseFurther(value);
    }

    function complexTypeParser(attributes) {
        if (!!attributes) {
            if (!(attributes instanceof Array)) {
                attributes = [attributes];
            }

            if (!attributes || attributes.length <= 0) {
                return;
            }

            for (let index in attributes) {
                attributeGroupParser(attributes[index]);
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    function parseFurther(value) {
        parse(value);
    }

    function parse(obj) {
        for (let key in obj) {
            const objValue = obj[key];

            switch (key) {
            case XS_ATTRIBUTE_GROUP:
                attributeGroupParser(objValue);
                break;
            case XS_SIMPLE_TYPE:
            case XS_COMPLEX_TYPE:
            case XS_ELEMENT:
            case XS_SEQUENCE:
            case XS_CHOICE:
                complexTypeParser(objValue);
                break;
            default:
                if (objValue instanceof Object) {
                    parseFurther(objValue);
                }
            }
        }
    }

    function formatPropertyName(value) {
        return value[0].toLowerCase() + value.substring(1);
    }

    function getBasicDataParser(propertyName) {
        if (!!propertyName) {
            if (!!propertyName.substr(0, 1).match(/[A-Za-z]/)) {
                try { // check if is not a reserved word
                    eval('let ' + propertyName + ' = 1;');

                    return `data.${propertyName}`;
                } catch (e) {
                    // is a reserved word
                }
            }
        }

        return `data['${propertyName}']`;
    }

    function parseDataCheck(typeModel, propertyName) {
        let dataParsing = getBasicDataParser(propertyName);
        const ternaryCheck = [dataParsing];

        if (!!typeModel) {
            let hasChanges = false;

            if (!!typeModel.pattern) {
                ternaryCheck.push(`${dataParsing}.match(/${typeModel.pattern}/g)`);
                hasChanges = true;
            }

            if (!!typeModel.minInclusive || !!typeModel.maxExclusive) {
                if (!!typeModel.minInclusive) {
                    ternaryCheck.push(`${dataParsing} >= ${typeModel.minInclusive}`);
                }

                if (!!typeModel.maxExclusive) {
                    ternaryCheck.push(`${dataParsing} < ${typeModel.maxExclusive}`);
                }

                hasChanges = true;
            }

            if (!!typeModel.maxLength) {
                dataParsing = `${dataParsing}.substring(0, ${typeModel.maxLength})`;
                hasChanges = true;
            }

            return hasChanges ? `(${ternaryCheck.join(' && ')}) ? ${dataParsing} : null` : dataParsing;
        } else {
            return dataParsing;
        }
    }

    function parseClassStaticName(prefix, value) {
        return !isNaN(parseInt(value[0])) ? `${prefix.toUpperCase()}_${value}` : value;
    }

    function createEnum(propertyType, basicType) {
        if (createdEnum.hasOwnProperty(propertyType)) {
            return;
        }

        let enums = basicType
            .enumeration
            .map(function (value) {
                return `static ${parseClassStaticName(propertyType, value).trim().toUpperCase()} = '${value}';`;
            });

        const className = getAsClassName(propertyType);

        const classCodeString = [
            `export default class ${className} {`,
            `    ${enums.sort(sortAlphabetic).join('\n    ')}`,
            ``,
            `    constructor() {`,
            `        throw Error('do not instantiate ${className}, ENUM class here');`,
            `    }`,
            ``,
            `    toString() {`,
            `        return JSON.stringify(this, null, 4);`,
            `    }`,
            `}`
        ].join('\n').trim();

        createFile(`${propertyType}.js`, classCodeString);

        createdEnum[propertyType] = basicType;

        enumsGenerated++;
    }

    function getNewTypeBuilder(propertyType, nestedComplexType, propertyName, property) {
        const dataString = parseDataCheck(nestedComplexType, propertyName);
        const className = getAsClassName(propertyType);

        let rtn = `${dataString} ? new ${className}(${dataString}) : null;`;

        if (!!property.minOccurs || property.maxOccurs) {
            rtn = `${dataString}.map(function(value){ return new ${className}(${parseDataCheck(nestedComplexType, 'value')}); }); // array`;
        }

        return rtn;
    }

    function sortAlphabetic(a, b) {
        return a && b ? a.localeCompare(b) : null;
    }

    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////

    parse(obj);

    for (let name in complexTypes) {
        const properties = getComplexType(name);
        const hasValidProperties = properties.some((value) => {
            return !!value;
        });

        if (!properties || properties.length <= 0 || !hasValidProperties) {
            // console.log(name, JSON.stringify(properties));
            delete complexTypes[name];
        }
    }

    // return;

    for (let name in complexTypes) {
        const properties = getComplexType(name);
        let imports = [];
        const members = [];

        for (let index in properties) {
            let property = properties[index];

            if (!property) {
                continue;
            }

            // debug(property);

            if (property.hasOwnProperty(SCOPE)) {
                property = property[SCOPE];
            }

            const propertyName = property.name || property.ref || property.type;

            if (!propertyName) {
                continue;
            }

            const propertyMemberName = formatPropertyName(propertyName);
            const propertyType = property.type || property.ref || propertyName;
            const basicType = basicTypes[propertyType];
            const nestedComplexType = complexTypes[propertyType];

            let memberValue = 'null;';

            if (!!basicType && !!basicType.enumeration) {
                createEnum(propertyType, basicType);

                memberValue = `${parseDataCheck(basicType, propertyName)}; // enum ${propertyType}`;
            } else if (!!basicType) {
                const basicTypeBase = basicType.base;

                if (complexTypes.hasOwnProperty(basicTypeBase)) {
                    imports.push(basicTypeBase);

                    memberValue = getNewTypeBuilder(basicTypeBase, complexTypes[basicTypeBase], propertyName, property);
                    memberValue = `${memberValue} // ${propertyType}`
                } else {
                    memberValue = `${parseDataCheck(basicType, propertyName)}; // ${basicTypeBase} ${propertyType}`;
                }
            }
            else if (!!nestedComplexType) {
                imports.push(propertyType);

                memberValue = getNewTypeBuilder(propertyType, nestedComplexType, propertyName, property);
            } else if (propertyType === BOOLEAN_TAG) {
                memberValue = `${getBasicDataParser(propertyName)}; // ${propertyType}`;
            } else if (propertyType === STRING_TAG) {
                memberValue = `${getBasicDataParser(propertyName)}; // ${propertyType}`;
            } else if (basicTypes.hasOwnProperty(propertyName) && !!basicTypes[propertyName].base) {
                memberValue = `${getBasicDataParser(propertyName)}; // ${basicTypes[propertyName].base}`;
            } else {
                memberValue = `${getBasicDataParser(propertyName)};`;
            }

            members.push(
                `this.${propertyMemberName} = ${memberValue}`
            );
        }

        imports = imports
            .filter(function (value, index, self) { // remove duplications
                return self.indexOf(value) === index && value.indexOf(NAMESPACE_PREFIX) < 0;
            })
            .map(function (value) {
                const importName = getAsClassName(value);

                return `import ${importName} from './${importName}';`;
            });

        if (members && members.length > -1) {
            const className = getAsClassName(name);
            const classCodeString = [
                imports.sort(sortAlphabetic).join('\n'),
                ``,
                `export default class ${className} {`,
                `    constructor(data) {`,
                `        if (!data) return;`,
                ``,
                `        ${members.sort(sortAlphabetic).join('\n        ').trim()}`,
                `    }`,
                ``,
                `    toString() {`,
                `        return JSON.stringify(this, null, 4);`,
                `    }`,
                `}`
            ].join('\n').trim();

            createFile(`${className}.js`, classCodeString);
        }
    }
}