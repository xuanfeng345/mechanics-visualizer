import math

def incline(alpha_deg=30, mu_k=.3, g=9.81, t=1.0):
    a=math.radians(alpha_deg)
    acc=g*(math.sin(a)-mu_k*math.cos(a))
    return acc, acc*t, .5*acc*t*t

if __name__ == '__main__':
    a,v,x=incline()
    print(f'acceleration={a:.12f} velocity={v:.12f} position={x:.12f}')
