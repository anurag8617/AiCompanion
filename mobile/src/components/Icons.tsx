import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

export const MailIcon = ({ color, size = 20 }: IconProps) => {
  const width = size;
  const height = size * 0.7;
  return (
    <View style={[styles.mailOuter, { width, height, borderColor: color }]}>
      <View style={[styles.mailVLeft, { backgroundColor: color }]} />
      <View style={[styles.mailVRight, { backgroundColor: color }]} />
    </View>
  );
};

export const LockIcon = ({ color, size = 20 }: IconProps) => {
  const bodyWidth = size;
  const bodyHeight = size * 0.65;
  const shackleWidth = size * 0.6;
  const shackleHeight = size * 0.55;

  return (
    <View style={{ width: size, height: size + 2, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={[
          styles.lockShackle,
          {
            width: shackleWidth,
            height: shackleHeight,
            borderColor: color,
            borderTopLeftRadius: shackleWidth / 2,
            borderTopRightRadius: shackleWidth / 2,
            bottom: bodyHeight - 2,
          },
        ]}
      />
      <View style={[styles.lockBody, { width: bodyWidth, height: bodyHeight, borderColor: color }]}>
        <View style={[styles.lockKeyhole, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const UserIcon = ({ color, size = 20 }: IconProps) => {
  const headSize = size * 0.45;
  const bodyWidth = size * 0.85;
  const bodyHeight = size * 0.4;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          styles.userHead,
          {
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            borderColor: color,
            marginBottom: 2,
          },
        ]}
      />
      <View
        style={[
          styles.userBody,
          {
            width: bodyWidth,
            height: bodyHeight,
            borderColor: color,
            borderTopLeftRadius: bodyWidth / 2,
            borderTopRightRadius: bodyWidth / 2,
          },
        ]}
      />
    </View>
  );
};

export const EyeIcon = ({ color, size = 20 }: IconProps) => {
  const pupilSize = size * 0.35;
  return (
    <View style={[styles.eyeOuter, { width: size, height: size * 0.65, borderColor: color, borderRadius: size * 0.3 }]}>
      <View style={[styles.eyePupil, { width: pupilSize, height: pupilSize, borderRadius: pupilSize / 2, backgroundColor: color }]} />
    </View>
  );
};

export const EyeOffIcon = ({ color, size = 20 }: IconProps) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <EyeIcon color={color} size={size} />
      <View style={[styles.slashLine, { backgroundColor: color, width: size * 1.2 }]} />
    </View>
  );
};

export const SunIcon = ({ color, size = 20 }: IconProps) => {
  const centerSize = size * 0.5;
  const rayLength = size * 0.15;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View
        style={{
          width: centerSize,
          height: centerSize,
          borderRadius: centerSize / 2,
          borderWidth: 2,
          borderColor: color,
        }}
      />
      {/* Sun rays represented by simple small line segments */}
      <View style={[styles.ray, { backgroundColor: color, height: rayLength, top: 0 }]} />
      <View style={[styles.ray, { backgroundColor: color, height: rayLength, bottom: 0 }]} />
      <View style={[styles.ray, { backgroundColor: color, width: rayLength, height: 2, left: 0 }]} />
      <View style={[styles.ray, { backgroundColor: color, width: rayLength, height: 2, right: 0 }]} />
    </View>
  );
};

export const MoonIcon = ({ color, size = 20 }: IconProps) => {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderLeftWidth: 3,
        borderBottomWidth: 3,
        borderTopWidth: 1.5,
        borderRightWidth: 0,
        borderColor: color,
        transform: [{ rotate: '-15deg' }],
      }}
    />
  );
};

export const MicIcon = ({ color, size = 20 }: IconProps) => {
  const micWidth = size * 0.4;
  const micHeight = size * 0.7;
  const standWidth = size * 0.6;
  const standHeight = size * 0.4;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: micWidth,
          height: micHeight,
          borderRadius: micWidth / 2,
          borderWidth: 2,
          borderColor: color,
          backgroundColor: color,
          zIndex: 2,
          marginTop: -size * 0.1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: standWidth,
          height: standHeight,
          borderBottomWidth: 2,
          borderLeftWidth: 2,
          borderRightWidth: 2,
          borderColor: color,
          borderBottomLeftRadius: standWidth / 2,
          borderBottomRightRadius: standWidth / 2,
          top: size * 0.4,
          zIndex: 1,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 2,
          height: size * 0.2,
          backgroundColor: color,
          bottom: size * 0.05,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size * 0.5,
          height: 2,
          backgroundColor: color,
          bottom: size * 0.05,
        }}
      />
    </View>
  );
};

export const XIcon = ({ color, size = 20 }: IconProps) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={[styles.xLine, { backgroundColor: color, width: size * 1.2, transform: [{ rotate: '45deg' }] }]} />
      <View style={[styles.xLine, { backgroundColor: color, width: size * 1.2, transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
};

export const HomeIcon = ({ color, size = 20 }: IconProps) => {
  const roofHeight = size * 0.4;
  const houseWidth = size * 0.8;
  const houseHeight = size * 0.5;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: houseWidth / 2 + 2,
          borderRightWidth: houseWidth / 2 + 2,
          borderBottomWidth: roofHeight,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          position: 'absolute',
          top: 2,
        }}
      />
      <View
        style={{
          width: houseWidth - 4,
          height: houseHeight,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
        }}
      >
        <View style={{ position: 'absolute', bottom: 0, left: '50%', marginLeft: -size * 0.15, width: size * 0.3, height: size * 0.25, backgroundColor: '#0A0F14', borderTopLeftRadius: 2, borderTopRightRadius: 2 }} />
      </View>
    </View>
  );
};

export const MessageIcon = ({ color, size = 20 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.9, height: size * 0.65, borderRadius: size * 0.2, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: size * 0.05, left: size * 0.2, width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderTopWidth: size * 0.2, borderRightWidth: size * 0.15, borderBottomWidth: 0, borderLeftWidth: 0, borderTopColor: color, borderRightColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: '15deg' }] }} />
  </View>
);

export const ProfileIcon = ({ color, size = 20 }: IconProps) => (
  <UserIcon color={color} size={size} />
);

export const BrainIcon = ({ color, size = 20 }: IconProps) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.7, borderRadius: size * 0.35, borderWidth: 2, borderColor: color, borderBottomWidth: 0 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: size * 0.8, height: size * 0.3 }}>
       <View style={{ width: '45%', height: '100%', borderWidth: 2, borderColor: color, borderTopWidth: 0, borderBottomLeftRadius: 4 }} />
       <View style={{ width: '45%', height: '100%', borderWidth: 2, borderColor: color, borderTopWidth: 0, borderBottomRightRadius: 4 }} />
    </View>
  </View>
);

export const TargetIcon = ({ color, size = 20 }: IconProps) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: size * 0.9, height: size * 0.9, borderRadius: size * 0.45, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25, borderWidth: 2, borderColor: color, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: size * 0.2, height: size * 0.2, borderRadius: size * 0.1, backgroundColor: color }} />
        </View>
      </View>
    </View>
  );
};

export const BriefcaseIcon = ({ color, size = 20 }: IconProps) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: size * 0.1 }}>
      <View style={{ width: size * 0.4, height: size * 0.2, borderWidth: 2, borderColor: color, borderBottomWidth: 0, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
      <View style={{ width: size * 0.9, height: size * 0.6, borderWidth: 2, borderColor: color, borderRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: size * 0.9, height: 2, backgroundColor: color }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mailOuter: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mailVLeft: {
    position: 'absolute',
    width: '65%',
    height: 1.5,
    top: '35%',
    left: '-5%',
    transform: [{ rotate: '30deg' }],
  },
  mailVRight: {
    position: 'absolute',
    width: '65%',
    height: 1.5,
    top: '35%',
    right: '-5%',
    transform: [{ rotate: '-30deg' }],
  },
  lockShackle: {
    borderWidth: 2,
    borderBottomWidth: 0,
    position: 'absolute',
  },
  lockBody: {
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockKeyhole: {
    width: 3,
    height: 6,
    borderRadius: 1,
  },
  userHead: {
    borderWidth: 2,
  },
  userBody: {
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  eyeOuter: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyePupil: {},
  slashLine: {
    position: 'absolute',
    height: 2,
    transform: [{ rotate: '-45deg' }],
  },
  ray: {
    position: 'absolute',
    width: 2,
  },
  xLine: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 1,
  },
});
