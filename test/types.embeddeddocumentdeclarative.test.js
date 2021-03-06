'use strict';

/**
 * Module dependencies.
 */

const assert = require('assert');
const start = require('./common');

const mongoose = start.mongoose;
const Schema = mongoose.Schema;

/**
 * Test.
 */

describe('types.embeddeddocumentdeclarative', function() {
  describe('with a parent with a field with type set to a POJO', function() {
    const ChildSchemaDef = {
      name: String,
    };

    const ParentSchemaDef = {
      name: String,
      child: {
        type: ChildSchemaDef,
      }
    };

    describe('with the default legacy behavior (typePojoToMixed=true)', function() {
      const ParentSchema = new mongoose.Schema(ParentSchemaDef);
      it('interprets the POJO as Mixed (gh-7494)', function(done) {
        assert.equal(ParentSchema.paths.child.instance, 'Mixed');
        done();
      });
      it('does not enforce provided schema on the child path (gh-7494)', function(done) {
        const ParentModel = mongoose.model('ParentModel-7494-EmbeddedDeclarativeMixed', ParentSchema);
        const swampGuide = new ParentModel({
          name: 'Swamp Guide',
          child: {
            name: 'Tingle',
            mixedUp: 'very',
          }
        });
        const tingle = swampGuide.toObject().child;

        assert.equal(tingle.name, 'Tingle');
        assert.equal(tingle.mixedUp, 'very');
        done();
      });
    });
    describe('with the optional subschema behavior (typePojoToMixed=false)', function() {
      const ParentSchema = new mongoose.Schema(ParentSchemaDef, {typePojoToMixed: false});
      it('interprets the POJO as a subschema (gh-7494)', function(done) {
        assert.equal(ParentSchema.paths.child.instance, 'Embedded');
        assert.strictEqual(ParentSchema.paths.child['$isSingleNested'], true);
        done();
      });
      it('enforces provided schema on the child path, unlike Mixed (gh-7494)', function(done) {
        const ParentModel = mongoose.model('ParentModel-7494-EmbeddedDeclarativeSubschema', ParentSchema);
        const kingDaphnes = new ParentModel({
          name: 'King Daphnes Nohansen Hyrule',
          child: {
            name: 'Princess Zelda',
            mixedUp: 'not',
          }
        });
        const princessZelda = kingDaphnes.child.toObject();

        assert.equal(princessZelda.name, 'Princess Zelda');
        assert.strictEqual(princessZelda.mixedUp, undefined);
        done();
      });
    });
  });
  describe('with a parent with a POJO field with a field "type" with a type set to "String"', function() {
    const ParentSchemaDef = {
      name: String,
      child: {
        name: String,
        type: {
          type: String,
        },
      }
    };
    const ParentSchemaNotMixed = new Schema(ParentSchemaDef);
    const ParentSchemaNotSubdoc = new Schema(ParentSchemaDef, {typePojoToMixed: false});
    it('does not create a path for child in either option', function(done) {
      assert.equal(ParentSchemaNotMixed.paths['child.name'].instance, 'String');
      assert.equal(ParentSchemaNotSubdoc.paths['child.name'].instance, 'String');
      done();
    });
    it('treats type as a property name not a type in both options', function(done) {
      assert.equal(ParentSchemaNotMixed.paths['child.type'].instance, 'String');
      assert.equal(ParentSchemaNotSubdoc.paths['child.type'].instance, 'String');
      done();
    });
    it('enforces provided schema on the child tree in both options, unlike Mixed (gh-7494)', function(done) {
      const ParentModelNotMixed = mongoose.model('ParentModel-7494-EmbeddedDeclarativeNestedNotMixed', ParentSchemaNotMixed);
      const ParentModelNotSubdoc = mongoose.model('ParentModel-7494-EmbeddedDeclarativeNestedNotSubdoc', ParentSchemaNotSubdoc);

      const grandmother = new ParentModelNotMixed({
        name: 'Grandmother',
        child: {
          name: 'Rito Chieftan',
          type: 'Mother',
          confidence: 10,
        }
      });
      const ritoChieftan = new ParentModelNotSubdoc({
        name: 'Rito Chieftan',
        child: {
          name: 'Prince Komali',
          type: 'Medli',
          confidence: 1,
        }
      });

      assert.equal(grandmother.child.name, 'Rito Chieftan');
      assert.equal(grandmother.child.type, 'Mother');
      assert.strictEqual(grandmother.child.confidence, undefined);
      assert.equal(ritoChieftan.child.name, 'Prince Komali');
      assert.equal(ritoChieftan.child.type, 'Medli');
      assert.strictEqual(ritoChieftan.child.confidence, undefined);
      done();
    });
  });
});
