import { Group } from 'three';
import { GLTFModel } from '../../Models';
import { loadedGLTFModels } from '../../utils/gltfHelper';
import { Logger } from '../../../systems/Logger';
import { AnimateWorkstation } from '../../animation/AnimateWorkstation';
import { CAMERA_RAY_LAYER } from '../../utils/constants';
import { Ammo } from './Ammo';

const DEBUG = false;

class WeaponBase {

    gltf;
    group;
    hittingBox;

    isDefault = false;

    specs;

    AWS;
    _clips = {};
    _animationSettings = {};

    _weaponType;
    _prepareInterval;
    _attackInterval;
    _startTime;
    _endTime;
    _fireRate;
    _damageRange;
    _damageRadius;
    _armedHeight;
    _isFiring = false;
    _magzineCapacity;
    _ammo;

    _shootNick;
    _emptyNick = 'empty';
    _animateMapping = {};

    #logger = new Logger(DEBUG, 'WeaponBase');

    constructor(specs) {
        
        const { name, scale = [1, 1, 1] } = specs;
        const { position = [0, 0, 0], rotation = [0, 0, 0] } = specs;
        const { offsetX = 0, offsetY = 0, offsetZ = 0 } = specs;
        const { receiveShadow = true, castShadow = true } = specs;
        const { 
            weaponType, 
            prepareInterval = 0, attackInterval = 1, startTime = 0, endTime = 1, fireRate = 1, 
            damageRange = 0, damageRadius = Math.PI, armedHeight = 0,
            magzineCapacity = 0, ammo = new Ammo(), 
            isSemiAutomatic = true, isDefault = false
        } = specs;
        const { clips, animationSetting } = specs;
        let { src } = specs;

        this.specs = specs;

        this._weaponType = weaponType;
        this._prepareInterval = prepareInterval;
        this._attackInterval = attackInterval;
        this._startTime = startTime;
        this._endTime = endTime;
        this._fireRate = fireRate;
        this._damageRange = damageRange;
        this._damageRadius = damageRadius;
        this._armedHeight = armedHeight;
        this._isSemiAutomatic = isSemiAutomatic;
        this._magzineCapacity = magzineCapacity;
        this._ammo = ammo;

        this.isDefault = isDefault;

        if (this.isDefault) return this;

        Object.assign(this._clips, clips);
        Object.assign(this._animationSettings, animationSetting);

        if (loadedGLTFModels[weaponType]) {

            src = loadedGLTFModels[weaponType];

        }

        // basic gltf model
        const gltfSpecs = { name: `${name}_gltf_model`, src, offsetX, offsetY, offsetZ, receiveShadow, castShadow };

        // gltf model
        this.gltf = new GLTFModel(gltfSpecs);
        this.gltf.setScale(scale);
        this.gltf.setPosition(position);
        this.gltf.setRotation(rotation);
        this.gltf.group.isWeapon = true;

        this.group = new Group();

        this.group.add(this.gltf.group);

    }

    async init() {

        if (this.isDefault) return;

        await this.gltf.init();

        if (!loadedGLTFModels[this._weaponType]) {

            loadedGLTFModels[this._weaponType] = this.gltf.gltf;

        }

        this.bindEvents();

        if (Object.getOwnPropertyNames(this._clips).length) {

            this.AWS = new AnimateWorkstation({ model: this.gltf, clipConfigs: this._clips });

            this.AWS.init();

            this.AWS.setActionEffectiveTimeScale(this._shootNick, this._fireRate);

        }

    }

    bindEvents() {

        const type = 'visibleChanged';
        const listener = (event) => {

            this.#logger.log(`${this.gltf.name}: ${event.message}`);
            this.gltf.setLayers(CAMERA_RAY_LAYER);

        };

        this.gltf.addEventListener(type, listener);
        this.gltf.eventList.set(type, listener);

    }

    get visible() {

        return this.gltf.visible;

    }

    set visible(val) {

        this.gltf.visible = val;

    }

    get weaponType() {

        return this._weaponType;

    }

    get prepareInterval() {

        return this._prepareInterval;

    }

    get attackInterval() {

        return this._attackInterval;

    }

    get startTime() {

        return this._startTime;

    }

    get endTime() {

        return this._endTime;

    }

    get fireRate() {

        return this._fireRate;

    }

    get damageRange() {

        return this._damageRange;

    }

    get damageRadius() {

        return this._damageRadius;

    }

    get armedHeight() {

        return this._armedHeight;

    }

    get ammoCount() {

        return this._ammo.count;

    }

    set ammoCount(val) {

        this._ammo.count = val;

    }

    get ammo() {

        return this._ammo;

    }

    set magzineCapacity(val) {

        this._magzineCapacity = val;

    }

    get magzineCapacity() {

        return this._magzineCapacity;

    }

    get magzineEmpty() {

        return this._ammo.count === 0;

    }

    get isFiring() {

        return this._isFiring;

    }

    set isFiring(val) {

        this._isFiring = val;

    }

    get isSemiAutomatic() {

        return this._isSemiAutomatic;

    }

    set isSemiAutomatic(val) {

        this._isSemiAutomatic = val;
        
    }

    get animateEnabled() {

        return this.AWS ? true: false;
        
    }

    fillMagzine(fillCount = this._magzineCapacity) {

        if (fillCount >= this._magzineCapacity) {

            this._ammo.count = this._magzineCapacity;

        } else {

            this._ammo.count = fillCount;

        }

        this.resetWeaponEmpty();

    }

    shoot() {

        if (this.animateEnabled) {

            this.AWS.playAction(this._shootNick);
            // this.AWS.prepareCrossFade(this.AWS.actions[this._shootNick], this.AWS.actions[this._shootNick], this._animationSettings.SHOOT, 1);

        }

    }

    cancelShoot() {

        if (this.animateEnabled) {

            // this.AWS.setActionEffectiveWeight(this._shootNick, 0);
            // this.AWS.actions[this._shootNick].stop();
            this.AWS.actions[this._shootNick].fadeOut(this._animationSettings.CANCEL_SHOOT);

        }

    }

    weaponEmpty() {

        if (this.animateEnabled) {

            this.AWS.prepareCrossFade(this.AWS.actions[this._shootNick], this.AWS.actions[this._emptyNick], this._animationSettings.EMPTY, 1);

        }

    }

    resetWeaponEmpty() {

        if (this.animateEnabled) {

            this.AWS.actions[this._emptyNick].stop();

        }

    }

}

export { WeaponBase };