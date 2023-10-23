(()=>{var H={136:(e,o,t)=>{"use strict";t.r(o),t.d(o,{default:()=>C});var n=t(537),r=t.n(n),a=t(645),A=t.n(a),h=A()(r());h.push([e.id,`
/* ******** Container ******** */
.service-item-container {
    background-color: #292929;
    display: flex;
    margin-top: 10px;
    padding: 20px 15px 20px 15px;

    min-height: 35px;

    border-style: solid;
    border-width: 2px;
    border-radius: 4px;
    border-color: transparent;

    /* Icon and text are centered on the secondary axis */
    align-items: center;

    cursor: pointer;
}

/* When a service item was clicked */
.service-item-container-selected {
    background-color: #3c3c3c;
    border-color: #0097fb;
}

/* ******** Icon ******** */
.icon-item {
    /* Separation between icon and text */
    margin-right: 15px;
}

/* The checkmark symbol */
.unlocked {
    color: #73c991;
}

/* The lock symbol but the user has clicked it */
.locked-selected {
    color: #0097fb;
}

/* ******** Text ******** */
.service-item-title {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    font-family: 'Verdana';
    line-height: 16px;
    margin-bottom: 5px;
    margin-top: 0;
}
.service-item-description {
    color: #cccccc;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Verdana';
    line-height: 14px;
    margin-bottom: 0;
    margin-top: 0;
}
.text-info-container {
    display: flex;
    flex-direction: column;
    text-align: left;
}

/* ******** Service Item Content Container ******** */
.service-item-content-list-item:empty {
    display: none;
}
`,"",{version:3,sources:["webpack://./src/credentials/vue/ServiceItem.vue"],names:[],mappings:";AAqOA,gCAAgC;AAEhC;IACI,yBAAyB;IACzB,aAAa;IACb,gBAAgB;IAChB,4BAA4B;;IAE5B,gBAAgB;;IAEhB,mBAAmB;IACnB,iBAAiB;IACjB,kBAAkB;IAClB,yBAAyB;;IAEzB,qDAAqD;IACrD,mBAAmB;;IAEnB,eAAe;AACnB;;AAEA,oCAAoC;AACpC;IACI,yBAAyB;IACzB,qBAAqB;AACzB;;AAEA,2BAA2B;AAC3B;IACI,qCAAqC;IACrC,kBAAkB;AACtB;;AAEA,yBAAyB;AACzB;IACI,cAAc;AAClB;;AAEA,gDAAgD;AAChD;IACI,cAAc;AAClB;;AAEA,2BAA2B;AAE3B;IACI,cAAc;IACd,eAAe;IACf,gBAAgB;IAChB,sBAAsB;IACtB,iBAAiB;IACjB,kBAAkB;IAClB,aAAa;AACjB;AAEA;IACI,cAAc;IACd,eAAe;IACf,gBAAgB;IAChB,sBAAsB;IACtB,iBAAiB;IACjB,gBAAgB;IAChB,aAAa;AACjB;AAEA;IACI,aAAa;IACb,sBAAsB;IACtB,gBAAgB;AACpB;;AAEA,qDAAqD;AAErD;IACI,aAAa;AACjB",sourcesContent:[`<!--
    This module focuses on the clickable box that represents a specific service/feature
    on the left side of the screen. It defines the base structure of the component and
    from there specific service item components can be defined.

    Additionaly, this module provides a state manager to keep track of the state of
    of the service items.
 -->
<template>
    <li class="service-item-container" :class="classWhenIsSelected" v-on:mousedown="serviceItemClicked">
        <!-- The icon -->
        <div class="icon-item" :class="serviceIconClass"></div>

        <!-- The text info -->
        <div class="text-info-container">
            <div class="service-item-title">
                {{ title }}
            </div>
            <div class="service-item-description">
                {{ description }}
            </div>
        </div>
    </li>

    <li class="service-item-content-list-item">
        <!-- See 'Named Slots' for more info -->
        <slot name="service-item-content-slot"></slot>
    </li>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ServiceItemContent } from './ServiceItemContent.vue'

/* The status of the icon for a service */
type ServiceIconStatus = keyof typeof serviceIconClasses

/* The general status of the service */
export type ServiceStatus = Exclude<ServiceIconStatus, 'LOCKED_SELECTED'>

/**
 * Maps a service status to the CSS classes that will create the icon.
 *
 * LOCKED_SELECTED is a case where the item is locked but selected by the user.
 */
const serviceIconClasses = {
    LOCKED: 'icon icon-lg icon-vscode-lock',
    LOCKED_SELECTED: 'icon icon-lg icon-vscode-lock locked-selected',
    UNLOCKED: 'icon icon-vscode-check unlocked',
} as const

/**
 * The static props that are expected to be passed to a ServiceItem component.
 *
 * Static here implies that these props are not expected to change after the component is created.
 */
export interface StaticServiceItemProps {
    title: string
    description: string
}

/**
 * The base component for a service item that should be extended
 * by specific service item components.
 */
export default defineComponent({
    name: 'ServiceItem',
    components: { ServiceItemContent },
    emits: ['service-item-clicked'],
    props: {
        id: {
            type: String as PropType<ServiceItemId>,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        status: {
            type: String as PropType<ServiceStatus>,
            default: 'LOCKED',
        },
        isSelected: {
            type: Boolean,
            default: false,
        },
        isLandscape: {
            type: Boolean,
            required: true,
            description: 'Whether the screen is in landscape mode or not.',
        },
    },
    data() {
        return {
            classWhenIsSelected: '',
            serviceIconClasses: serviceIconClasses,
            serviceIconClass: '',
        }
    },
    created() {
        // The CSS class that should be applied to the container when the item is selected.
        this.classWhenIsSelected = this.isSelected ? 'service-item-container-selected' : ''

        // The CSS class that determines which icon to show.
        const serviceIconStatus: ServiceIconStatus =
            this.isSelected && this.status === 'LOCKED' ? 'LOCKED_SELECTED' : this.status
        this.serviceIconClass = this.serviceIconClasses[serviceIconStatus]
    },
    methods: {
        serviceItemClicked() {
            this.$emit('service-item-clicked', this.id)
        },
    },
})

/**
 * ------------------- Service Item Implementations -------------------
 *
 * All specific service item components should be defined below.
 */

/**
 * A Service Item ID is the main identifier/representation of a specific service item.
 */
export type ServiceItemId = keyof typeof staticServiceItemProps

const staticServiceItemProps = {
    NON_AUTH_FEATURES: {
        title: 'Debug Lambda Functions & Edit AWS Document Types',
        description: "Local features that don't require authentication",
    },
    RESOURCE_EXPLORER: {
        title: 'Resource Explorer',
        description: 'View, modify, deploy, and troubleshoot AWS resources',
    },
    CODE_WHISPERER: {
        title: 'Amazon CodeWhisperer',
        description: 'Build applications faster with AI code recommendations',
    },
    CODE_CATALYST: {
        title: 'Amazon CodeCatalyst',
        description: 'Spark a faster planning, development, and delivery lifecycle on AWS',
    },
} as const

/* -------------------------------------- */

/**
 * This class is responsible for keeping track of the state of all service items.
 *
 * As the user interacts with the service items, certain methods of this class
 * can be used to update the state of specific service items. Then, the method
 * {@link getServiceIds} can be used to get the latest state of all service items.
 */
export class ServiceItemsState {
    /**
     * IDs of all services that are currently unlocked
     *
     * Note the default unlocked service(s) are pre-defined here.
     */
    private readonly unlockedServices: Set<ServiceItemId> = new Set(['NON_AUTH_FEATURES'])

    /** Note a service item is pre-selected by default */
    private currentlySelected?: ServiceItemId = 'NON_AUTH_FEATURES'

    /**
     * The Ids of the service items, separated by the ones that are locked vs. unlocked
     *
     * IMPORTANT: This is the source of truth of the current state of all service items.
     *            Use the methods of this class to modify the states of items, then use
     *            this method to get the latest state.
     */
    getServiceIds(): { unlocked: ServiceItemId[]; locked: ServiceItemId[] } {
        const allServiceIds = Object.keys(staticServiceItemProps) as ServiceItemId[]
        const unlockedConstructorIds = allServiceIds.filter(id => this.unlockedServices.has(id))
        const lockedConstructorIds = allServiceIds.filter(id => !this.unlockedServices.has(id))

        return {
            unlocked: unlockedConstructorIds,
            locked: lockedConstructorIds,
        }
    }

    /**
     * Static Service Item props are the props that are not expected to change
     * after the component is created.
     */
    getStaticServiceItemProps(id: ServiceItemId): StaticServiceItemProps {
        return staticServiceItemProps[id]
    }

    /** The currently selected service item */
    get selected(): ServiceItemId | undefined {
        return this.currentlySelected
    }

    /** Marks the item as selected by the user */
    select(id: ServiceItemId) {
        this.currentlySelected = id
    }

    deselect() {
        this.currentlySelected = undefined
    }

    toggleSelected(id: ServiceItemId) {
        if (this.currentlySelected === id) {
            this.deselect()
        } else {
            this.select(id)
        }
    }

    /** Marks the item as being 'unlocked', implying the required auth is completed. */
    unlock(id: ServiceItemId) {
        this.unlockedServices.add(id)
    }

    /** Marks the item as being 'locked', implying the required auth is NOT completed. */
    lock(id: ServiceItemId) {
        this.unlockedServices.delete(id)
    }
}
<\/script>

<style>
/* ******** Container ******** */

.service-item-container {
    background-color: #292929;
    display: flex;
    margin-top: 10px;
    padding: 20px 15px 20px 15px;

    min-height: 35px;

    border-style: solid;
    border-width: 2px;
    border-radius: 4px;
    border-color: transparent;

    /* Icon and text are centered on the secondary axis */
    align-items: center;

    cursor: pointer;
}

/* When a service item was clicked */
.service-item-container-selected {
    background-color: #3c3c3c;
    border-color: #0097fb;
}

/* ******** Icon ******** */
.icon-item {
    /* Separation between icon and text */
    margin-right: 15px;
}

/* The checkmark symbol */
.unlocked {
    color: #73c991;
}

/* The lock symbol but the user has clicked it */
.locked-selected {
    color: #0097fb;
}

/* ******** Text ******** */

.service-item-title {
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    font-family: 'Verdana';
    line-height: 16px;
    margin-bottom: 5px;
    margin-top: 0;
}

.service-item-description {
    color: #cccccc;
    font-size: 12px;
    font-weight: 500;
    font-family: 'Verdana';
    line-height: 14px;
    margin-bottom: 0;
    margin-top: 0;
}

.text-info-container {
    display: flex;
    flex-direction: column;
    text-align: left;
}

/* ******** Service Item Content Container ******** */

.service-item-content-list-item:empty {
    display: none;
}
</style>
`],sourceRoot:""}]);const C=h},819:(e,o,t)=>{"use strict";t.r(o),t.d(o,{default:()=>C});var n=t(537),r=t.n(n),a=t(645),A=t.n(a),h=A()(r());h.push([e.id,`
#service-item-content-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border-style: solid;
    border-width: 2px;
    border-radius: 4px;
    border-color: #0097fb;

    width: 700px;
    height: 100%;

    /* For testing purposes, before we have content to fill */
    min-height: 600px;
}
`,"",{version:3,sources:["webpack://./src/credentials/vue/ServiceItemContent.vue"],names:[],mappings:";AAWA;IACI,aAAa;IACb,sBAAsB;IACtB,mBAAmB;IACnB,uBAAuB;;IAEvB,mBAAmB;IACnB,iBAAiB;IACjB,kBAAkB;IAClB,qBAAqB;;IAErB,YAAY;IACZ,YAAY;;IAEZ,yDAAyD;IACzD,iBAAiB;AACrB",sourcesContent:[`<template>
    <div id="service-item-content-container">TODO</div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'

export const ServiceItemContent = defineComponent({})

export default ServiceItemContent
<\/script>
<style>
#service-item-content-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    border-style: solid;
    border-width: 2px;
    border-radius: 4px;
    border-color: #0097fb;

    width: 700px;
    height: 100%;

    /* For testing purposes, before we have content to fill */
    min-height: 600px;
}
</style>
`],sourceRoot:""}]);const C=h},332:(e,o,t)=>{"use strict";t.r(o),t.d(o,{default:()=>C});var n=t(537),r=t.n(n),a=t(645),A=t.n(a),h=A()(r());h.push([e.id,`
/** By default  */
.flex-container {
    display: flex;
    flex-direction: row;
}
#left-column {
    width: 500px;
    box-sizing: border-box;
    margin: 10px;
}
.service-item-list {
    list-style-type: none;
    margin: 0;
    padding: 0;
}
.service-item-list li {
    /* Creates an even separation between all list items*/
    margin-top: 10px;
}
#right-column {
    /* This can be deleted, for development purposes */
    height: 800px;
    margin: 10px;
}
`,"",{version:3,sources:["webpack://./src/credentials/vue/root.vue"],names:[],mappings:";AA0HA,iBAAiB;AACjB;IACI,aAAa;IACb,mBAAmB;AACvB;AAEA;IACI,YAAY;IACZ,sBAAsB;IACtB,YAAY;AAChB;AAEA;IACI,qBAAqB;IACrB,SAAS;IACT,UAAU;AACd;AAEA;IACI,qDAAqD;IACrD,gBAAgB;AACpB;AAEA;IACI,kDAAkD;IAClD,aAAa;IACb,YAAY;AAChB",sourcesContent:[`<template>
    <div class="flex-container">
        <div id="left-column">
            <div>
                <h1>Select a feature to get started</h1>
                <ul class="service-item-list" v-for="itemId in unlockedItemIds">
                    <ServiceItem
                        :title="getServiceItemProps(itemId).title"
                        :description="getServiceItemProps(itemId).description"
                        :status="'UNLOCKED'"
                        :isSelected="isServiceSelected(itemId)"
                        :isLandscape="isLandscape"
                        :id="itemId"
                        :key="buildServiceItemKey(itemId, 'UNLOCKED')"
                        @service-item-clicked="serviceWasSelected(itemId)"
                    >
                        <template v-slot:service-item-content-slot v-if="isServiceSelected(itemId) && !isLandscape">
                            <ServiceItemContent></ServiceItemContent>
                        </template>
                    </ServiceItem>
                </ul>
            </div>

            <div>
                <h3>UNLOCK ADDITIONAL FEATURES</h3>
                <div>Some features have additional authentication requirements to use. <a>Read more.</a></div>

                <ul class="service-item-list" v-for="itemId in lockedItemIds">
                    <ServiceItem
                        :title="getServiceItemProps(itemId).title"
                        :description="getServiceItemProps(itemId).description"
                        :status="'LOCKED'"
                        :isSelected="isServiceSelected(itemId)"
                        :isLandscape="isLandscape"
                        :id="itemId"
                        :key="buildServiceItemKey(itemId, 'LOCKED')"
                        @service-item-clicked="serviceWasSelected(itemId)"
                    >
                        <template v-slot:service-item-content-slot v-if="isServiceSelected(itemId) && !isLandscape">
                            <ServiceItemContent></ServiceItemContent>
                        </template>
                    </ServiceItem>
                </ul>
            </div>
            <h3></h3>
        </div>
        <div v-if="isLandscape && isAnyServiceSelected" id="right-column">
            <ServiceItemContent></ServiceItemContent>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ServiceItem, { ServiceItemsState, ServiceItemId, ServiceStatus, StaticServiceItemProps } from './ServiceItem.vue'
import ServiceItemContent from './ServiceItemContent.vue'

const serviceItemsState = new ServiceItemsState()

export default defineComponent({
    components: { ServiceItem, ServiceItemContent },
    name: 'AuthRoot',
    data() {
        return {
            unlockedItemIds: [] as ServiceItemId[],
            lockedItemIds: [] as ServiceItemId[],
            currWindowWidth: window.innerWidth,
        }
    },
    created() {
        this.renderItems()
    },
    mounted() {
        window.addEventListener('resize', this.updateWindowWidth)
    },
    unmounted() {
        window.removeEventListener('resize', this.updateWindowWidth)
    },
    computed: {
        isLandscape() {
            return this.currWindowWidth > 1300
        },
        isAnyServiceSelected(): boolean {
            return serviceItemsState.selected !== undefined
        },
    },
    methods: {
        /**
         * Triggers a rendering of the service items.
         */
        renderItems() {
            const { unlocked, locked } = serviceItemsState.getServiceIds()
            this.unlockedItemIds = unlocked
            this.lockedItemIds = locked
        },
        isServiceSelected(id: ServiceItemId): boolean {
            return serviceItemsState.selected === id
        },
        getServiceItemProps(id: ServiceItemId): StaticServiceItemProps {
            return serviceItemsState.getStaticServiceItemProps(id)
        },
        serviceWasSelected(id: ServiceItemId): void {
            serviceItemsState.select(id)
            this.renderItems()
        },
        /**
         * Builds a unique key for a service item to optimize re-rendering.
         *
         * This allows Vue to know which existing component to compare to the new one.
         * https://vuejs.org/api/built-in-special-attributes.html#key
         */
        buildServiceItemKey(id: ServiceItemId, lockStatus: ServiceStatus) {
            return id + '_' + (this.isServiceSelected(id) ? \`\${lockStatus}_SELECTED\` : \`\${lockStatus}\`)
        },
        updateWindowWidth() {
            this.currWindowWidth = window.innerWidth
        },
    },
})
<\/script>

<style>
/** By default  */
.flex-container {
    display: flex;
    flex-direction: row;
}

#left-column {
    width: 500px;
    box-sizing: border-box;
    margin: 10px;
}

.service-item-list {
    list-style-type: none;
    margin: 0;
    padding: 0;
}

.service-item-list li {
    /* Creates an even separation between all list items*/
    margin-top: 10px;
}

#right-column {
    /* This can be deleted, for development purposes */
    height: 800px;
    margin: 10px;
}
</style>
`],sourceRoot:""}]);const C=h},645:e=>{"use strict";e.exports=function(o){var t=[];return t.toString=function(){return this.map(function(r){var a="",A=typeof r[5]!="undefined";return r[4]&&(a+="@supports (".concat(r[4],") {")),r[2]&&(a+="@media ".concat(r[2]," {")),A&&(a+="@layer".concat(r[5].length>0?" ".concat(r[5]):""," {")),a+=o(r),A&&(a+="}"),r[2]&&(a+="}"),r[4]&&(a+="}"),a}).join("")},t.i=function(r,a,A,h,C){typeof r=="string"&&(r=[[null,r,void 0]]);var y={};if(A)for(var B=0;B<this.length;B++){var k=this[B][0];k!=null&&(y[k]=!0)}for(var E=0;E<r.length;E++){var p=[].concat(r[E]);A&&y[p[0]]||(typeof C!="undefined"&&(typeof p[5]=="undefined"||(p[1]="@layer".concat(p[5].length>0?" ".concat(p[5]):""," {").concat(p[1],"}")),p[5]=C),a&&(p[2]&&(p[1]="@media ".concat(p[2]," {").concat(p[1],"}")),p[2]=a),h&&(p[4]?(p[1]="@supports (".concat(p[4],") {").concat(p[1],"}"),p[4]=h):p[4]="".concat(h)),t.push(p))}},t}},537:e=>{"use strict";e.exports=function(o){var t=o[1],n=o[3];if(!n)return t;if(typeof btoa=="function"){var r=btoa(unescape(encodeURIComponent(JSON.stringify(n)))),a="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(r),A="/*# ".concat(a," */");return[t].concat([A]).join(`
`)}return[t].join(`
`)}},744:(e,o)=>{"use strict";var t;t={value:!0},o.Z=(n,r)=>{for(const[a,A]of r)n[a]=A;return n}},608:(e,o,t)=>{var n=t(136);n.__esModule&&(n=n.default),typeof n=="string"&&(n=[[e.id,n,""]]),n.locals&&(e.exports=n.locals);var r=t(346).Z,a=r("5b7f6c99",n,!1,{})},968:(e,o,t)=>{var n=t(819);n.__esModule&&(n=n.default),typeof n=="string"&&(n=[[e.id,n,""]]),n.locals&&(e.exports=n.locals);var r=t(346).Z,a=r("15f98848",n,!1,{})},796:(e,o,t)=>{var n=t(332);n.__esModule&&(n=n.default),typeof n=="string"&&(n=[[e.id,n,""]]),n.locals&&(e.exports=n.locals);var r=t(346).Z,a=r("59678e2d",n,!1,{})},346:(e,o,t)=>{"use strict";t.d(o,{Z:()=>K});function n(s,u){for(var l=[],d={},c=0;c<u.length;c++){var _=u[c],m=_[0],b=_[1],g=_[2],D=_[3],f={id:s+":"+c,css:b,media:g,sourceMap:D};d[m]?d[m].parts.push(f):l.push(d[m]={id:m,parts:[f]})}return l}var r=typeof document!="undefined";if(typeof DEBUG!="undefined"&&DEBUG&&!r)throw new Error("vue-style-loader cannot be used in a non-browser environment. Use { target: 'node' } in your Webpack config to indicate a server-rendering environment.");var a={},A=r&&(document.head||document.getElementsByTagName("head")[0]),h=null,C=0,y=!1,B=function(){},k=null,E="data-vue-ssr-id",p=typeof navigator!="undefined"&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());function K(s,u,l,d){y=l,k=d||{};var c=n(s,u);return W(c),function(m){for(var b=[],g=0;g<c.length;g++){var D=c[g],f=a[D.id];f.refs--,b.push(f)}m?(c=n(s,m),W(c)):c=[];for(var g=0;g<b.length;g++){var f=b[g];if(f.refs===0){for(var T=0;T<f.parts.length;T++)f.parts[T]();delete a[f.id]}}}}function W(s){for(var u=0;u<s.length;u++){var l=s[u],d=a[l.id];if(d){d.refs++;for(var c=0;c<d.parts.length;c++)d.parts[c](l.parts[c]);for(;c<l.parts.length;c++)d.parts.push(P(l.parts[c]));d.parts.length>l.parts.length&&(d.parts.length=l.parts.length)}else{for(var _=[],c=0;c<l.parts.length;c++)_.push(P(l.parts[c]));a[l.id]={id:l.id,refs:1,parts:_}}}}function w(){var s=document.createElement("style");return s.type="text/css",A.appendChild(s),s}function P(s){var u,l,d=document.querySelector("style["+E+'~="'+s.id+'"]');if(d){if(y)return B;d.parentNode.removeChild(d)}if(p){var c=C++;d=h||(h=w()),u=M.bind(null,d,c,!1),l=M.bind(null,d,c,!0)}else d=w(),u=j.bind(null,d),l=function(){d.parentNode.removeChild(d)};return u(s),function(m){if(m){if(m.css===s.css&&m.media===s.media&&m.sourceMap===s.sourceMap)return;u(s=m)}else l()}}var R=function(){var s=[];return function(u,l){return s[u]=l,s.filter(Boolean).join(`
`)}}();function M(s,u,l,d){var c=l?"":d.css;if(s.styleSheet)s.styleSheet.cssText=R(u,c);else{var _=document.createTextNode(c),m=s.childNodes;m[u]&&s.removeChild(m[u]),m.length?s.insertBefore(_,m[u]):s.appendChild(_)}}function j(s,u){var l=u.css,d=u.media,c=u.sourceMap;if(d&&s.setAttribute("media",d),k.ssrId&&s.setAttribute(E,u.id),c&&(l+=`
/*# sourceURL=`+c.sources[0]+" */",l+=`
/*# sourceMappingURL=data:application/json;base64,`+btoa(unescape(encodeURIComponent(JSON.stringify(c))))+" */"),s.styleSheet)s.styleSheet.cssText=l;else{for(;s.firstChild;)s.removeChild(s.firstChild);s.appendChild(document.createTextNode(l))}}}},V={};function S(e){var o=V[e];if(o!==void 0)return o.exports;var t=V[e]={id:e,exports:{}};return H[e](t,t.exports,S),t.exports}S.n=e=>{var o=e&&e.__esModule?()=>e.default:()=>e;return S.d(o,{a:o}),o},S.d=(e,o)=>{for(var t in o)S.o(o,t)&&!S.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:o[t]})},S.o=(e,o)=>Object.prototype.hasOwnProperty.call(e,o),S.r=e=>{typeof Symbol!="undefined"&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var O={};(()=>{"use strict";S.r(O);const e=Vue,o={class:"flex-container"},t={id:"left-column"},n=(0,e.createElementVNode)("h1",null,"Select a feature to get started",-1),r={class:"service-item-list"},a=(0,e.createElementVNode)("h3",null,"UNLOCK ADDITIONAL FEATURES",-1),A=(0,e.createElementVNode)("div",null,[(0,e.createTextVNode)("Some features have additional authentication requirements to use. "),(0,e.createElementVNode)("a",null,"Read more.")],-1),h={class:"service-item-list"},C=(0,e.createElementVNode)("h3",null,null,-1),y={key:0,id:"right-column"};function B(i,v,N,U,x,Y){const L=(0,e.resolveComponent)("ServiceItemContent"),Z=(0,e.resolveComponent)("ServiceItem");return(0,e.openBlock)(),(0,e.createElementBlock)("div",o,[(0,e.createElementVNode)("div",t,[(0,e.createElementVNode)("div",null,[n,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(i.unlockedItemIds,I=>((0,e.openBlock)(),(0,e.createElementBlock)("ul",r,[((0,e.openBlock)(),(0,e.createBlock)(Z,{title:i.getServiceItemProps(I).title,description:i.getServiceItemProps(I).description,status:"UNLOCKED",isSelected:i.isServiceSelected(I),isLandscape:i.isLandscape,id:I,key:i.buildServiceItemKey(I,"UNLOCKED"),onServiceItemClicked:G=>i.serviceWasSelected(I)},(0,e.createSlots)({_:2},[i.isServiceSelected(I)&&!i.isLandscape?{name:"service-item-content-slot",fn:(0,e.withCtx)(()=>[(0,e.createVNode)(L)])}:void 0]),1032,["title","description","isSelected","isLandscape","id","onServiceItemClicked"]))]))),256))]),(0,e.createElementVNode)("div",null,[a,A,((0,e.openBlock)(!0),(0,e.createElementBlock)(e.Fragment,null,(0,e.renderList)(i.lockedItemIds,I=>((0,e.openBlock)(),(0,e.createElementBlock)("ul",h,[((0,e.openBlock)(),(0,e.createBlock)(Z,{title:i.getServiceItemProps(I).title,description:i.getServiceItemProps(I).description,status:"LOCKED",isSelected:i.isServiceSelected(I),isLandscape:i.isLandscape,id:I,key:i.buildServiceItemKey(I,"LOCKED"),onServiceItemClicked:G=>i.serviceWasSelected(I)},(0,e.createSlots)({_:2},[i.isServiceSelected(I)&&!i.isLandscape?{name:"service-item-content-slot",fn:(0,e.withCtx)(()=>[(0,e.createVNode)(L)])}:void 0]),1032,["title","description","isSelected","isLandscape","id","onServiceItemClicked"]))]))),256))]),C]),i.isLandscape&&i.isAnyServiceSelected?((0,e.openBlock)(),(0,e.createElementBlock)("div",y,[(0,e.createVNode)(L)])):(0,e.createCommentVNode)("v-if",!0)])}const k={class:"text-info-container"},E={class:"service-item-title"},p={class:"service-item-description"},K={class:"service-item-content-list-item"};function W(i,v,N,U,x,Y){return(0,e.openBlock)(),(0,e.createElementBlock)(e.Fragment,null,[(0,e.createElementVNode)("li",{class:(0,e.normalizeClass)(["service-item-container",i.classWhenIsSelected]),onMousedown:v[0]||(v[0]=(...L)=>i.serviceItemClicked&&i.serviceItemClicked(...L))},[(0,e.createCommentVNode)(" The icon "),(0,e.createElementVNode)("div",{class:(0,e.normalizeClass)(["icon-item",i.serviceIconClass])},null,2),(0,e.createCommentVNode)(" The text info "),(0,e.createElementVNode)("div",k,[(0,e.createElementVNode)("div",E,(0,e.toDisplayString)(i.title),1),(0,e.createElementVNode)("div",p,(0,e.toDisplayString)(i.description),1)])],34),(0,e.createElementVNode)("li",K,[(0,e.createCommentVNode)(" See 'Named Slots' for more info "),(0,e.renderSlot)(i.$slots,"service-item-content-slot")])],64)}const w={id:"service-item-content-container"};function P(i,v,N,U,x,Y){return(0,e.openBlock)(),(0,e.createElementBlock)("div",w,"TODO")}const R=(0,e.defineComponent)({}),M=R;var j=S(968),s=S(744);const l=(0,s.Z)(M,[["render",P]]),d={LOCKED:"icon icon-lg icon-vscode-lock",LOCKED_SELECTED:"icon icon-lg icon-vscode-lock locked-selected",UNLOCKED:"icon icon-vscode-check unlocked"},c=(0,e.defineComponent)({name:"ServiceItem",components:{ServiceItemContent:R},emits:["service-item-clicked"],props:{id:{type:String,required:!0},title:{type:String,required:!0},description:{type:String,required:!0},status:{type:String,default:"LOCKED"},isSelected:{type:Boolean,default:!1},isLandscape:{type:Boolean,required:!0,description:"Whether the screen is in landscape mode or not."}},data(){return{classWhenIsSelected:"",serviceIconClasses:d,serviceIconClass:""}},created(){this.classWhenIsSelected=this.isSelected?"service-item-container-selected":"";const i=this.isSelected&&this.status==="LOCKED"?"LOCKED_SELECTED":this.status;this.serviceIconClass=this.serviceIconClasses[i]},methods:{serviceItemClicked(){this.$emit("service-item-clicked",this.id)}}}),_={NON_AUTH_FEATURES:{title:"Debug Lambda Functions & Edit AWS Document Types",description:"Local features that don't require authentication"},RESOURCE_EXPLORER:{title:"Resource Explorer",description:"View, modify, deploy, and troubleshoot AWS resources"},CODE_WHISPERER:{title:"Amazon CodeWhisperer",description:"Build applications faster with AI code recommendations"},CODE_CATALYST:{title:"Amazon CodeCatalyst",description:"Spark a faster planning, development, and delivery lifecycle on AWS"}};class m{constructor(){this.unlockedServices=new Set(["NON_AUTH_FEATURES"]),this.currentlySelected="NON_AUTH_FEATURES"}getServiceIds(){const v=Object.keys(_),N=v.filter(x=>this.unlockedServices.has(x)),U=v.filter(x=>!this.unlockedServices.has(x));return{unlocked:N,locked:U}}getStaticServiceItemProps(v){return _[v]}get selected(){return this.currentlySelected}select(v){this.currentlySelected=v}deselect(){this.currentlySelected=void 0}toggleSelected(v){this.currentlySelected===v?this.deselect():this.select(v)}unlock(v){this.unlockedServices.add(v)}lock(v){this.unlockedServices.delete(v)}}var b=S(608);const D=(0,s.Z)(c,[["render",W]]),f=new m,T=(0,e.defineComponent)({components:{ServiceItem:D,ServiceItemContent:l},name:"AuthRoot",data(){return{unlockedItemIds:[],lockedItemIds:[],currWindowWidth:window.innerWidth}},created(){this.renderItems()},mounted(){window.addEventListener("resize",this.updateWindowWidth)},unmounted(){window.removeEventListener("resize",this.updateWindowWidth)},computed:{isLandscape(){return this.currWindowWidth>1300},isAnyServiceSelected(){return f.selected!==void 0}},methods:{renderItems(){const{unlocked:i,locked:v}=f.getServiceIds();this.unlockedItemIds=i,this.lockedItemIds=v},isServiceSelected(i){return f.selected===i},getServiceItemProps(i){return f.getStaticServiceItemProps(i)},serviceWasSelected(i){f.select(i),this.renderItems()},buildServiceItemKey(i,v){return i+"_"+(this.isServiceSelected(i)?`${v}_SELECTED`:`${v}`)},updateWindowWidth(){this.currWindowWidth=window.innerWidth}}});var J=S(796);const X=(0,s.Z)(T,[["render",B]]);/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This module is run within the webview, and will mount the Vue app.
 */const F=()=>(0,e.createApp)(X),q=F();q.mount("#vue-app"),window.addEventListener("remount",()=>{q.unmount(),F().mount("#vue-app")})})();var z=this;for(var $ in O)z[$]=O[$];O.__esModule&&Object.defineProperty(z,"__esModule",{value:!0})})();

//# sourceMappingURL=index.js.map